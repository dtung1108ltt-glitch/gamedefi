from fastapi import APIRouter, HTTPException, Request

from app.blockchain.adapter_resolver import UnsupportedChainError
from app.blockchain.solana_adapter import SolanaAdapter, SolanaAdapterError
from app.schemas import TransactionOut
from app.core.config import get_settings
from app.rewards.reconciliation import reconcile_claim

router = APIRouter(prefix="/blockchain", tags=["blockchain"])


@router.get("/solana/config")
def solana_config():
    settings = get_settings()
    return {"chain": "solana", "network": settings.solana_network,
            "program_id": settings.solana_program_id}


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
                request.app.state.settings.reward_distributor_authority,
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
