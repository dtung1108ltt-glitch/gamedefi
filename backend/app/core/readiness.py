"""Read-only chain checks for deployment and operational monitoring."""

import base64
import time
from datetime import datetime, timedelta, timezone

import base58
from solders.pubkey import Pubkey
from sqlalchemy import func, select, text

from app.blockchain.solana_adapter import SolanaAdapter
from app.core.config import Settings
from app.core.mainnet import MAINNET_GENESIS
from app.dex.persistence import DexSwapModel, DexSwapRepository
from app.rewards.persistence import RewardClaimModel, RewardRepository


UPGRADEABLE_LOADER = "BPFLoaderUpgradeab1e11111111111111111111111"
DEVNET_GENESIS = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG"
_READINESS_CACHE_TTL_SECONDS = 10.0
_readiness_cache: dict | None = None
_readiness_cache_at: float = 0.0
def _account(adapter: SolanaAdapter, address: str) -> tuple[dict, bytes]:
    response = adapter._rpc("getAccountInfo", [address, {"encoding": "base64", "commitment": "finalized"}])
    account = response.get("value") if isinstance(response, dict) else None
    if not isinstance(account, dict):
        raise ValueError(f"Account {address} chưa tồn tại")
    raw = base64.b64decode(account["data"][0], validate=True)
    return account, raw


def _program_authority(adapter: SolanaAdapter, program_id: str) -> str:
    program, raw = _account(adapter, program_id)
    if program.get("owner") != UPGRADEABLE_LOADER or not program.get("executable"):
        raise ValueError("Program không thuộc upgradeable loader hoặc chưa executable")
    if len(raw) != 36 or int.from_bytes(raw[:4], "little") != 2:
        raise ValueError("Program account không có layout hợp lệ")
    programdata, data = _account(adapter, str(Pubkey.from_bytes(raw[4:36])))
    if programdata.get("owner") != UPGRADEABLE_LOADER or len(data) < 45:
        raise ValueError("ProgramData không hợp lệ")
    if int.from_bytes(data[:4], "little") != 3 or data[12] != 1:
        raise ValueError("ProgramData không có upgrade authority")
    return str(Pubkey.from_bytes(data[13:45]))


def _valid_address(value: str) -> bool:
    if not value or not 32 <= len(value) <= 44:
        return False
    try:
        return len(base58.b58decode(value)) == 32
    except Exception:
        return False


def check_devnet_configuration(settings: Settings) -> tuple[dict[str, bool], list[str]]:
    """Validate Devnet env values without touching RPC/DB. Returns (checks, missing_vars)."""
    required_env = {
        "SOLANA_PROGRAM_ID": settings.solana_program_id,
        "SOLANA_RPC_URL": settings.solana_rpc_url,
        "SOLANA_NETWORK": settings.solana_network,
        "DATABASE_URL": settings.database_url,
        "REWARD_DISTRIBUTOR_CONFIG": settings.reward_distributor_config,
        "REWARD_DISTRIBUTOR_VAULT": settings.reward_distributor_vault,
        "REWARD_DISTRIBUTOR_AUTHORITY": settings.reward_distributor_authority,
        "REWARD_DISTRIBUTOR_KEYPAIR_PATH": settings.reward_distributor_keypair_path,
        "GAME_TOKEN_MINT": settings.game_token_mint,
    }
    missing = sorted(name for name, value in required_env.items() if not (value or "").strip())
    addresses = {
        "program_id_valid": settings.solana_program_id,
        "reward_config_valid": settings.reward_distributor_config,
        "reward_vault_valid": settings.reward_distributor_vault,
        "reward_authority_valid": settings.reward_distributor_authority,
        "game_token_mint_valid": settings.game_token_mint,
    }
    checks = {name: _valid_address(value or "") for name, value in addresses.items()}
    checks["network_is_devnet"] = settings.solana_network == "devnet"
    checks["rpc_url_present"] = bool((settings.solana_rpc_url or "").strip())
    checks["database_url_present"] = bool((settings.database_url or "").strip())
    return checks, missing


def check_devnet_readiness(
    settings: Settings,
    adapter: SolanaAdapter,
    dex_swaps: DexSwapRepository,
    reward_claims: RewardRepository,
) -> dict:
    checks: dict[str, bool] = {}
    try:
        checks["rpc_devnet"] = adapter.get_genesis_hash() == DEVNET_GENESIS
    except Exception:
        checks["rpc_devnet"] = False

    try:
        program, _ = _account(adapter, settings.solana_program_id)
        checks["program"] = program.get("owner") == UPGRADEABLE_LOADER and program.get("executable") is True
    except Exception:
        checks["program"] = False

    try:
        checks["reward_signer"] = (
            str(adapter._load_sol_reward_signer().pubkey()) == settings.sol_reward_signer_address
        )
    except Exception:
        checks["reward_signer"] = False

    try:
        with dex_swaps.engine.connect() as connection:
            connection.execute(text("SELECT 1 FROM dex_swaps LIMIT 1"))
        with reward_claims.engine.connect() as connection:
            connection.execute(text("SELECT 1 FROM reward_claims LIMIT 1"))
        checks["database"] = True
    except Exception:
        checks["database"] = False

    return {
        "status": "ok" if all(value for key, value in checks.items() if key != "reward_signer") else "unavailable",
        "network": settings.solana_network,
        "checks": checks,
    }


def _spl_token_balance_ui(adapter: SolanaAdapter, owner: str, mint: str) -> float | None:
    """Tổng số dư SPL token của owner cho mint (đơn vị UI). None khi RPC lỗi."""
    try:
        result = adapter._rpc("getTokenAccountsByOwner", [owner, {"mint": mint}, {"encoding": "jsonParsed"}])
        accounts = (result or {}).get("value") or []
        total = 0.0
        for item in accounts:
            try:
                total += float(item["account"]["data"]["parsed"]["info"]["tokenAmount"]["uiAmount"] or 0)
            except (KeyError, TypeError, ValueError):
                continue
        return total
    except Exception:
        return None


def check_deployment_readiness(
    settings: Settings,
    adapter: SolanaAdapter,
    dex_swaps: DexSwapRepository,
    reward_claims: RewardRepository,
) -> dict:
    """GET /health/ready cho Devnet: 200 chỉ khi TẤT CẢ check đạt.

    Không bao giờ trả private key, nội dung keypair hay chuỗi kết nối DB.
    """
    global _readiness_cache, _readiness_cache_at
    now = time.monotonic()
    if _readiness_cache is not None and now - _readiness_cache_at < _READINESS_CACHE_TTL_SECONDS:
        return _readiness_cache

    from app.core.reward_signer import validate_reward_distributor_signer

    config_checks, missing = check_devnet_configuration(settings)
    checks: dict[str, bool] = {f"config_{k}": v for k, v in config_checks.items()}
    details: dict[str, object] = {"missing_env": missing}

    try:
        with dex_swaps.engine.connect() as connection:
            connection.execute(text("SELECT 1 FROM dex_swaps LIMIT 1"))
        with reward_claims.engine.connect() as connection:
            connection.execute(text("SELECT 1 FROM reward_claims LIMIT 1"))
        checks["database"] = True
    except Exception:
        checks["database"] = False

    try:
        # getHealth rẻ hơn getGenesisHash; fallback blockhash khi node chưa bắt kịp.
        try:
            checks["rpc"] = adapter._rpc("getHealth", []) == "ok"
        except Exception:
            latest = adapter._rpc("getLatestBlockhash", [{"commitment": "confirmed"}])
            checks["rpc"] = bool(latest and latest.get("value", {}).get("blockhash"))
    except Exception:
        checks["rpc"] = False

    try:
        program, _ = _account(adapter, settings.solana_program_id)
        checks["program"] = program.get("owner") == UPGRADEABLE_LOADER and program.get("executable") is True
    except Exception:
        checks["program"] = False

    signer_problem = validate_reward_distributor_signer(settings)
    checks["signer"] = signer_problem is None
    if signer_problem:
        details["signer"] = signer_problem

    balances_ok = True
    try:
        sol_lamports = adapter.get_native_balance(settings.reward_distributor_authority)
        checks["balances_sol"] = sol_lamports >= settings.devnet_min_sol_lamports
        details["authority_sol_lamports"] = sol_lamports
        balances_ok = balances_ok and checks["balances_sol"]
    except Exception:
        checks["balances_sol"] = False
        balances_ok = False
    vault_ui = _spl_token_balance_ui(adapter, settings.reward_distributor_vault, settings.game_token_mint)
    if vault_ui is None:
        checks["balances_vault"] = False
        balances_ok = False
    else:
        vault_base = int(vault_ui * (10 ** settings.game_token_decimals))
        checks["balances_vault"] = vault_base >= settings.reward_max_amount_base_units
        details["vault_hkdv_base_units"] = vault_base
        balances_ok = balances_ok and checks["balances_vault"]
    checks["balances"] = balances_ok

    report = {
        "status": "ok" if all(checks.values()) else "unavailable",
        "network": settings.solana_network,
        "checks": checks,
        "details": details,
    }
    _readiness_cache = report
    _readiness_cache_at = now
    return report


def check_mainnet_readiness(
    settings: Settings,
    adapter: SolanaAdapter,
    dex_swaps: DexSwapRepository,
    reward_claims: RewardRepository,
) -> dict:
    if settings.solana_network == "devnet":
        return check_devnet_readiness(settings, adapter, dex_swaps, reward_claims)
    if settings.solana_network != "mainnet-beta":
        return {"status": "ok", "network": settings.solana_network, "checks": {}}

    checks: dict[str, bool] = {}
    metrics: dict[str, int] = {}
    try:
        checks["rpc_mainnet"] = adapter.get_genesis_hash() == MAINNET_GENESIS
    except Exception:
        checks["rpc_mainnet"] = False
    if not checks["rpc_mainnet"]:
        return {"status": "unavailable", "network": settings.solana_network, "checks": checks, "metrics": metrics}

    try:
        checks["program_upgrade_authority"] = (
            _program_authority(adapter, settings.solana_program_id) == settings.mainnet_upgrade_authority
        )
    except Exception:
        checks["program_upgrade_authority"] = False

    cutoff = datetime.now(timezone.utc) - timedelta(minutes=15)
    try:
        with dex_swaps.engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            metrics["stale_dex_swaps"] = connection.scalar(select(func.count()).select_from(DexSwapModel).where(
                DexSwapModel.network == "mainnet-beta",
                DexSwapModel.status == "pending_confirmation",
                DexSwapModel.updated_at < cutoff,
            )) or 0
        with reward_claims.engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            metrics["stale_reward_claims"] = connection.scalar(select(func.count()).select_from(RewardClaimModel).where(
                RewardClaimModel.network == "mainnet-beta",
                RewardClaimModel.asset_symbol == "SOL",
                RewardClaimModel.status.in_(("submitted", "submission_unknown")),
                RewardClaimModel.updated_at < cutoff,
            )) or 0
        checks["database"] = True
        checks["no_stale_submissions"] = metrics["stale_dex_swaps"] == 0 and metrics["stale_reward_claims"] == 0
    except Exception:
        checks["database"] = False
        checks["no_stale_submissions"] = False

    return {
        "status": "ok" if all(checks.values()) else "unavailable",
        "network": settings.solana_network,
        "checks": checks,
        "metrics": metrics,
    }
