from functools import lru_cache

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "vn-history-gamefi-backend"

    # SQLAlchemy URL. Production should use postgresql+psycopg.
    database_url: str = "sqlite+pysqlite:///./gamefi-dev.db"
    database_auto_create: bool = True

    # --- Solana ---
    solana_network: str = "devnet"
    solana_rpc_url: str = "https://api.devnet.solana.com"
    solana_program_id: str = ""
    solana_gas_budget_lamports: int = 5_000_000
    battle_reward_lamports: int = 100_000
    quest_reward_lamports: int = 200_000
    reward_max_lamports: int = 1_000_000

    sol_reward_signer_address: str = "6RigAPgKTdEwxmRqaoMiJj6GYnkipTSwRRc9Wkw79rTv"
    sol_reward_signer_keypair_base64: str = ""

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
