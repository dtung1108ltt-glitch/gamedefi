"""Fail closed when a Mainnet deployment still contains Devnet identities."""

from urllib.parse import urlparse

from solders.pubkey import Pubkey

from app.core.config import Settings


DEVNET_ADDRESSES = {
    "8qUBTgX99v5EhxbAaxuqS94rgfRhnLrTgW66Gh9BvLKN",
}
MAINNET_GENESIS = "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp"


def mainnet_configuration_errors(settings: Settings) -> list[str]:
    if settings.solana_network != "mainnet-beta":
        return []

    errors: list[str] = []
    addresses = {
        "SOLANA_PROGRAM_ID": settings.solana_program_id,
        "MAINNET_UPGRADE_AUTHORITY": settings.mainnet_upgrade_authority,
    }
    for name, value in addresses.items():
        if not value or value in DEVNET_ADDRESSES:
            errors.append(f"{name} phải là địa chỉ Mainnet riêng")
            continue
        try:
            Pubkey.from_string(value)
        except ValueError:
            errors.append(f"{name} không phải địa chỉ Solana hợp lệ")

    if not settings.jupiter_api_key.strip():
        errors.append("JUPITER_API_KEY còn trống")
    if settings.jupiter_base_url.rstrip("/") != "https://api.jup.ag/swap/v2":
        errors.append("JUPITER_BASE_URL phải là API Jupiter chính thức")
    rpc = urlparse(settings.solana_rpc_url)
    if rpc.scheme != "https" or not rpc.hostname or "devnet" in rpc.hostname or "testnet" in rpc.hostname:
        errors.append("SOLANA_RPC_URL phải là HTTPS Mainnet RPC")
    if not settings.database_url.startswith("postgresql+psycopg://") or settings.database_auto_create:
        errors.append("Mainnet cần PostgreSQL và DATABASE_AUTO_CREATE=false")
    origins = [origin.strip() for origin in settings.cors_allow_origins.split(",") if origin.strip()]
    if not origins or any(urlparse(origin).scheme != "https" for origin in origins):
        errors.append("CORS_ALLOW_ORIGINS phải chỉ chứa HTTPS origin production")
    return errors


def validate_mainnet_configuration(settings: Settings) -> None:
    errors = mainnet_configuration_errors(settings)
    if errors:
        raise ValueError("Cấu hình Mainnet chưa an toàn: " + "; ".join(errors))
