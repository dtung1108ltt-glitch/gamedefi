from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


# Resolve project files from the module location so the backend behaves the same no
# matter which directory uvicorn, a script or pytest was started from.
CORE_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CORE_DIR.parents[1]
PROJECT_DIR = BACKEND_DIR.parent


def config_path_candidates(value: str) -> list[Path]:
    """Absolute candidates for a configured path, best match first.

    ``~`` is expanded and absolute paths (Windows or POSIX) are used untouched. A
    relative path is resolved from the project directory, and ``backend/`` is also
    tried unless the value already starts with it.
    """
    if not value or not value.strip():
        raise ValueError("Đường dẫn cấu hình còn trống")
    raw = value.strip().strip('"').strip("'")
    expanded = Path(raw).expanduser()
    if expanded.is_absolute() or raw.startswith(("/", "\\")):
        return [expanded]
    project_relative = PROJECT_DIR / expanded
    if expanded.parts and expanded.parts[0].lower() == "backend":
        return [project_relative]
    return [project_relative, BACKEND_DIR / expanded]


def cors_allowed_origins(value: str) -> list[str]:
    """Parse CORS_ALLOW_ORIGINS: phân cách dấu phẩy, bỏ khoảng trắng và '/' cuối."""
    origins: list[str] = []
    for part in (value or "").split(","):
        origin = part.strip().rstrip("/")
        if origin:
            origins.append(origin)
    return origins


class Settings(BaseSettings):
    # backend/.env is loaded regardless of the working directory; the CWD copy stays
    # supported for backwards compatibility.
    model_config = SettingsConfigDict(
        env_file=(str(BACKEND_DIR / ".env"), ".env"),
        extra="ignore",
    )

    app_name: str = "vn-history-gamefi-backend"

    # SQLAlchemy URL. Production should use postgresql+psycopg.
    database_url: str = "sqlite+pysqlite:///./gamefi-dev.db"
    database_auto_create: bool = True
    # Set true in deployed environments: startup then fails fast when the reward
    # distributor signer is unusable instead of failing later at payout time.
    devnet_deployed: bool = False

    # --- Solana ---
    solana_network: str = "devnet"
    solana_rpc_url: str = "https://api.devnet.solana.com"
    solana_program_id: str = ""
    solana_gas_budget_lamports: int = 5_000_000
    battle_reward_lamports: int = 100_000
    quest_reward_lamports: int = 200_000
    reward_max_lamports: int = 1_000_000

    sol_reward_signer_address: str = "Dih26ZAcA8bdc6CMXUzEvZzgpkiRLfJ9LH2y1tL2w2js"
    sol_reward_signer_keypair_base64: str = ""

    # --- Fixed-supply HKDV game token (Solana Devnet, phase 4) ---
    game_token_name: str = "Hao Khi Dai Viet"
    game_token_symbol: str = "HKDV"
    game_token_mint: str = "45kZL6u62pbEmLiiZuUeuPWcotqZb8DLMmaPD5tNs1qm"
    game_token_decimals: int = 6
    game_token_total_supply: str = "1000000000"
    game_token_program: str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
    game_token_treasury_owner: str = "HUQHQv86C6sqqEWMpq8VcUs6kmQo78EsDV9cgEC9GaLK"
    game_token_treasury_account: str = "3d3aVnwqsre4AfnvVCMvkLvLZ7YbxY3A6P5Er3wKg1Sp"
    game_token_metadata_uri: str = "https://raw.githubusercontent.com/duynguyen658/gamedefi/main/vietnam-history-gamefi/assets/token/hkdv.json"


    # --- Program-controlled HKDV reward vault (Solana Devnet, phase 5) ---
    reward_distributor_config: str = "3MHpXEzsFkeJeYdPMmnL8LMCY3r3Ew3wm753fZacTCuw"
    reward_distributor_admin: str = "oV3Y4Z6DvPvBWGvbgLvfjxHoyVbWZkr1KHmNMHLDA7T"
    reward_distributor_vault: str = "9ngszc2V6RBRxgtagHCsn6s369aZoKWHb8uXShZAhoS7"
    reward_distributor_authority: str = "Dih26ZAcA8bdc6CMXUzEvZzgpkiRLfJ9LH2y1tL2w2js"
    reward_max_amount_base_units: int = 1_000_000_000
    reward_vault_allocation_base_units: int = 1_000_000_000_000
    reward_vault_alert_threshold_base_units: int = 10_000_000_000
    reward_mainnet_enabled: bool = False
    # Backend-only signer. Relative paths resolve from the project directory, then from
    # backend/, so the file is found no matter where the server was started. Never commit it.
    reward_distributor_keypair_path: str = "backend/keys/reward-distributor.json"
    # Fallback for Render when no Secret File is mounted: JSON array of 64 ints 0-255.
    # Never log this value. File path above takes precedence when it exists.
    reward_distributor_keypair_json: str = ""
    # Devnet readiness balance floors (base units). Override per environment if needed.
    devnet_min_sol_lamports: int = 50_000_000  # 0.05 SOL for the distributor authority.
    devnet_min_vault_hkdv_base_units: int = 1_000_000_000

    # --- DEX ---
    # Devnet uses verified SOL/test-token Raydium CPMM pools. Mainnet uses Jupiter.
    raydium_cpmm_program_id: str = "DRaycpLY18LhpbydsBWbVJtxpNv9oXPgjRSfpF2bWpYb"
    raydium_usdc_pool_id: str = "FeRts7d5DfXKXq1hGMkeiGEHayDdjsmSyJ41rHVcKo8t"
    raydium_usdc_config_id: str = "5Gt9qrPJ6FVe9VHtwF2W2JrFR6p9jmx4DxBkgfPdaApk"
    raydium_usdc_wsol_vault: str = "4qkXenqkyjWo5MozQvQSBWMa7xoSQtojcy5Z7FkJfKzm"
    raydium_usdc_token_vault: str = "yuy43wAJF4LKQqS5G28ckHAXbeNYBgaaBqDdhrZgd3i"
    raydium_usdt_pool_id: str = "Bw9gaeKqQy5aTpi1BiSdV2p21REATtVXDdhjPUFjgq6N"
    raydium_usdt_config_id: str = "5MxLgy9oPdTC3YgkiePHqr3EoCRD9uLVYRQS2ANAs7wy"
    raydium_usdt_wsol_vault: str = "Gnw1rRef7YWPLQ4ynZWKtzMZYncLgubXUzWwsmSHThSL"
    raydium_usdt_token_vault: str = "GU6yLWN7ftBJgpPgdeMbBqoTqAPYpWNv74HkQbobhC9k"
    jupiter_api_key: str = ""
    jupiter_base_url: str = "https://api.jup.ag/swap/v2"
    dex_mainnet_enabled: bool = False
    mainnet_upgrade_authority: str = ""
    dex_mock_sol_usdc_rate: float = 100.0

    nonce_ttl_seconds: int = 300
    session_ttl_seconds: int = 3_600
    # Comma-separated browser origins.  Keep this explicit because every
    # browser client sends bearer credentials for write operations.
    cors_allow_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    factions_file: str = "assets/nft/factions.json"

    @field_validator("database_url", mode="before")
    @classmethod
    def use_psycopg_driver(cls, value: str) -> str:
        if value.startswith("postgres://"):
            return "postgresql+psycopg://" + value[len("postgres://"):]
        if value.startswith("postgresql://"):
            return "postgresql+psycopg://" + value[len("postgresql://"):]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()
