import pytest
from fastapi import HTTPException
from solders.keypair import Keypair

from app.api.dex import require_trading_enabled
from app.api.reward import submit_event_reward
from app.core.config import Settings
from app.core.mainnet import mainnet_configuration_errors, validate_mainnet_configuration
from app.dex.interface import token_registry


def test_mainnet_defaults_fail_closed():
    settings = Settings(_env_file=None, solana_network="mainnet-beta")
    errors = mainnet_configuration_errors(settings)
    assert any("JUPITER_API_KEY" in error for error in errors)
    assert any("MAINNET_UPGRADE_AUTHORITY" in error for error in errors)
    with pytest.raises(ValueError, match="Mainnet chưa an toàn"):
        validate_mainnet_configuration(settings)
    assert set(token_registry("mainnet-beta")) == {"SOL", "USDC"}


def test_mainnet_requires_valid_program_rpc_and_jupiter():
    settings = Settings(
        _env_file=None,
        solana_network="mainnet-beta",
        solana_rpc_url="https://rpc.example.com",
        solana_program_id=str(Keypair().pubkey()),
        mainnet_upgrade_authority=str(Keypair().pubkey()),
        jupiter_api_key="test-key",
        database_url="postgresql+psycopg://user:password@db.example.com/gamefi",
        database_auto_create=False,
        cors_allow_origins="https://game.example.com",
    )
    validate_mainnet_configuration(settings)


def test_mainnet_dex_stays_closed_until_explicitly_enabled():
    class Request:
        class app:
            class state:
                settings = Settings(_env_file=None, solana_network="mainnet-beta")

    with pytest.raises(HTTPException) as exc:
        require_trading_enabled(Request())
    assert exc.value.status_code == 503
    Request.app.state.settings.dex_mainnet_enabled = True
    require_trading_enabled(Request())


def test_mainnet_reward_is_unavailable():
    class Request:
        class app:
            class state:
                settings = Settings(_env_file=None, solana_network="mainnet-beta")

    with pytest.raises(HTTPException) as exc:
        submit_event_reward(request=Request(), event=None, amount=1)
    assert exc.value.status_code == 503
