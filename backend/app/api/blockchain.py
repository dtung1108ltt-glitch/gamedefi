import time

import base58
from fastapi import APIRouter, HTTPException, Request
from solders.system_program import ID as SYSTEM_PROGRAM_ID

from app.blockchain.adapter_resolver import UnsupportedChainError
from app.blockchain.solana_adapter import SolanaAdapter, SolanaAdapterError
from app.core.config import get_settings
from app.schemas import TransactionOut
from app.rewards.reconciliation import reconcile_claim

router = APIRouter(prefix="/blockchain", tags=["blockchain"])

# Cache kết quả getAccountInfo vài giây: FE gọi /solana/config 2 lần mỗi lần mở trang.
_CONFIG_CACHE_TTL_SECONDS = 10.0
_config_cache: dict[str, object] | None = None
_config_cache_at: float = 0.0


def _valid_program_id(program_id: str) -> bool:
    """Base58 32 bytes, độ dài thực tế 32-44 ký tự (không phải placeholder System Program)."""
    if not program_id or not 32 <= len(program_id) <= 44:
        return False
    try:
        decoded = base58.b58decode(program_id)
    except Exception:
        return False
    return len(decoded) == 32


def _check_program_deployed(program_id: str) -> tuple[bool | None, str | None]:
    """Trả (deployed, error_code): True/False khi gọi RPC được, None khi RPC lỗi."""
    global _config_cache, _config_cache_at
    now = time.monotonic()
    if _config_cache is not None and now - _config_cache_at < _CONFIG_CACHE_TTL_SECONDS:
        return _config_cache["program_deployed"], _config_cache["error_code"]  # type: ignore[typeddict-item]
    settings = get_settings()
    try:
        from app.blockchain.adapter_resolver import AdapterResolver
        adapter = AdapterResolver(settings).get("solana")
        result = adapter._rpc("getAccountInfo", [program_id, {"encoding": "base64", "commitment": "finalized"}])
        account = result.get("value") if isinstance(result, dict) else None
        deployed = isinstance(account, dict) and account.get("executable") is True
        error_code = None if deployed else "PROGRAM_NOT_DEPLOYED"
    except Exception:
        deployed, error_code = None, "RPC_UNREACHABLE"
    _config_cache = {"program_deployed": deployed, "error_code": error_code}
    _config_cache_at = now
    return deployed, error_code


@router.get("/solana/config")
def solana_config():
    settings = get_settings()
    program_id = (settings.solana_program_id or "").strip()
    if not program_id:
        return {"chain": "solana", "network": settings.solana_network,
                "program_id": "", "configured": False, "program_deployed": False,
                "error_code": "NOT_CONFIGURED",
                "message": "Backend chưa cấu hình SOLANA_PROGRAM_ID (kiểm tra backend/.env)."}
    if not _valid_program_id(program_id) or program_id == str(SYSTEM_PROGRAM_ID):
        return {"chain": "solana", "network": settings.solana_network,
                "program_id": program_id, "configured": False, "program_deployed": False,
                "error_code": "INVALID_PROGRAM_ID",
                "message": "SOLANA_PROGRAM_ID sai định dạng (phải là base58 32 bytes)."}
    deployed, rpc_error = _check_program_deployed(program_id)
    if rpc_error == "RPC_UNREACHABLE":
        return {"chain": "solana", "network": settings.solana_network,
                "program_id": program_id, "configured": True, "program_deployed": False,
                "error_code": "RPC_UNREACHABLE",
                "message": "Không kết nối được Solana RPC, thử lại sau."}
    if not deployed:
        return {"chain": "solana", "network": settings.solana_network,
                "program_id": program_id, "configured": True, "program_deployed": False,
                "error_code": "PROGRAM_NOT_DEPLOYED",
                "message": f"Program chưa deploy trên {settings.solana_network}."}
    return {"chain": "solana", "network": settings.solana_network,
            "program_id": program_id, "configured": True, "program_deployed": True,
            "error_code": None, "message": "Solana program sẵn sàng."}


@router.get("/solana/reward-wallet")
def solana_reward_wallet(request: Request):
    settings = request.app.state.settings
    adapter = request.app.state.resolver.get("solana")
    configured = False
    balance_lamports = None
    if isinstance(adapter, SolanaAdapter):
        try:
            adapter._load_sol_reward_signer()
            configured = True
        except SolanaAdapterError:
            pass
        try:
            balance_lamports = adapter.get_native_balance(settings.sol_reward_signer_address)
        except SolanaAdapterError:
            pass
    return {
        "network": settings.solana_network,
        "address": settings.sol_reward_signer_address,
        "balance_lamports": balance_lamports,
        "configured": configured,
        "active": settings.solana_network == "devnet" and configured and
                  balance_lamports is not None and balance_lamports > settings.reward_max_lamports,
    }


@router.get("/{chain}/transaction/{digest}", response_model=TransactionOut)
def get_transaction(chain: str, digest: str, request: Request):
    try:
        adapter = request.app.state.resolver.get(chain)
    except UnsupportedChainError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    tx = adapter.get_transaction(digest)
    if tx is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy transaction")
    claim = request.app.state.reward_claims.get_by_signature(digest)
    if claim:
        try:
            reconcile_claim(
                request.app.state.reward_claims,
                adapter,
                claim,
                request.app.state.settings.sol_reward_signer_address,
            )
        except SolanaAdapterError:
            pass
    return TransactionOut(
        digest=tx.digest,
        status=tx.status,
        sender=tx.sender,
        timestamp_ms=tx.timestamp_ms,
        events=tx.events,
    )
