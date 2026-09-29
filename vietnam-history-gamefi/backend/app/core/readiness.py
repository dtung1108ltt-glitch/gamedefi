"""Read-only chain checks for deployment and operational monitoring."""

import base64
from datetime import datetime, timedelta, timezone

from solders.pubkey import Pubkey
from sqlalchemy import func, select, text

from app.blockchain.solana_adapter import SolanaAdapter
from app.core.config import Settings
from app.core.mainnet import MAINNET_GENESIS
from app.dex.persistence import DexSwapModel, DexSwapRepository
from app.rewards.persistence import RewardClaimModel, RewardRepository


UPGRADEABLE_LOADER = "BPFLoaderUpgradeab1e11111111111111111111111"
DEVNET_GENESIS = "EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG"
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
