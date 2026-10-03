import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import advisor, army, auth, battle, blockchain, dex, faction, leaderboard, marketplace, quest, reward, daily_quest
from app.blockchain.adapter_resolver import AdapterResolver
from app.blockchain.solana_adapter import SolanaAdapterError
from app.core.config import cors_allowed_origins, get_settings
from app.core.mainnet import validate_mainnet_configuration
from app.core.readiness import check_deployment_readiness, check_mainnet_readiness
from app.core.reward_signer import (
    RewardSignerError,
    reward_signer_required_at_startup,
    validate_reward_distributor_signer,
)
from app.core.security import NonceStore, SessionStore
from app.dex.market_price import MarketPriceService
from app.dex.persistence import DexSwapRepository
from app.dex.resolver import create_dex_provider
from app.rewards.persistence import RewardPersistenceError, RewardRepository


logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    settings = get_settings()
    validate_mainnet_configuration(settings)
    validate_devnet_deployment(settings)
    # Validate the payout signer while starting so a broken REWARD_DISTRIBUTOR_KEYPAIR_PATH
    # is visible in the logs instead of only failing when the first reward is claimed.
    reward_signer_error = validate_reward_distributor_signer(settings)
    if reward_signer_error and reward_signer_required_at_startup(settings):
        raise RewardSignerError(reward_signer_error)
    app = FastAPI(title="Hào Khí Đại Việt — Gameplay-First Strategy Game")

    @app.exception_handler(RewardSignerError)
    async def reward_signer_unavailable(_request, exc):
        return JSONResponse(status_code=503, content={"detail": str(exc)})

    @app.exception_handler(SolanaAdapterError)
    async def solana_unavailable(_request, exc):
        return JSONResponse(status_code=503, content={"detail": str(exc)})

    @app.exception_handler(RewardPersistenceError)
    async def reward_persistence_unavailable(_request, exc):
        return JSONResponse(status_code=503, content={"detail": str(exc)})

    allowed_origins = cors_allowed_origins(settings.cors_allow_origins)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.state.settings = settings
    app.state.resolver = AdapterResolver(settings)
    app.state.nonce_store = NonceStore(settings.nonce_ttl_seconds)
    app.state.session_store = SessionStore(
        settings.session_ttl_seconds, settings.database_url,
        create_schema=settings.database_auto_create,
    )
    app.state.dex_provider = create_dex_provider(settings)
    app.state.market_price = MarketPriceService()
    app.state.dex_swaps = DexSwapRepository(settings.database_url, create_schema=settings.database_auto_create)
    app.state.reward_claims = RewardRepository(settings.database_url, create_schema=settings.database_auto_create)
    if reward_signer_error:
        logger.error("Reward distributor signer chưa sẵn sàng: %s", reward_signer_error)

    app.include_router(auth.router)
    app.include_router(faction.router)
    app.include_router(advisor.router)
    app.include_router(army.router)
    app.include_router(battle.router)
    app.include_router(quest.router)
    app.include_router(daily_quest.router)
    app.include_router(leaderboard.router)
    app.include_router(marketplace.router)
    app.include_router(blockchain.router)
    app.include_router(reward.router)
    app.include_router(dex.router)

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok", "mode": "gameplay_first", "tagline": "History is the Game. Blockchain is the Marketplace."}

    @app.get("/health/ready")
    def ready():
        if settings.solana_network == "devnet":
            report = check_deployment_readiness(
                settings, app.state.resolver.get("solana"), app.state.dex_swaps, app.state.reward_claims,
            )
        else:
            report = check_mainnet_readiness(
                settings, app.state.resolver.get("solana"), app.state.dex_swaps, app.state.reward_claims,
            )
        if report["status"] != "ok":
            return JSONResponse(status_code=503, content=report)
        return report

    return app


def validate_devnet_deployment(settings) -> None:
    """Fail fast khi DEVNET_DEPLOYED=true: thiếu biến, signer thiếu/sai đều chặn khởi động.

    Local (DEVNET_DEPLOYED=false) chỉ log cảnh báo, không làm hỏng các route khác.
    """
    from app.core.readiness import check_devnet_configuration

    if not settings.devnet_deployed:
        return
    config_checks, missing = check_devnet_configuration(settings)
    problems = list(missing)
    problems.extend(f"INVALID_{name}" for name, ok in config_checks.items() if not ok)
    signer_problem = validate_reward_distributor_signer(settings)
    if signer_problem:
        problems.append(f"SIGNER: {signer_problem}")
    if problems:
        raise RewardSignerError(
            "DEVNET_DEPLOYED=true nhưng cấu hình chưa đủ: " + "; ".join(problems)
        )


app = create_app()
