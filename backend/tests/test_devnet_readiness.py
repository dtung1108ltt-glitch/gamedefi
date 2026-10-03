import base64

from solders.keypair import Keypair

from app.core.config import Settings
from app.core.readiness import (
    DEVNET_GENESIS,
    UPGRADEABLE_LOADER,
    check_deployment_readiness,
    check_devnet_configuration,
    check_devnet_readiness,
)
from app.dex.persistence import DexSwapRepository
from app.rewards.persistence import RewardRepository


class DevnetAdapter:
    def __init__(self, program_id, signer):
        self.program_id = program_id
        self.signer = signer
        self.genesis = DEVNET_GENESIS

    def get_genesis_hash(self):
        return self.genesis

    def _rpc(self, method, params):
        assert method == "getAccountInfo"
        if params[0] != self.program_id:
            return {"value": None}
        return {"value": {
            "owner": UPGRADEABLE_LOADER,
            "executable": True,
            "data": [base64.b64encode(b"program").decode(), "base64"],
        }}

    def _load_sol_reward_signer(self):
        if self.signer is None:
            raise FileNotFoundError("signer missing")
        return self.signer


def test_devnet_ready_requires_rpc_program_signer_and_migrated_tables(tmp_path):
    program = str(Keypair().pubkey())
    signer = Keypair()
    settings = Settings(
        _env_file=None,
        solana_network="devnet",
        solana_program_id=program,
        sol_reward_signer_address=str(signer.pubkey()),
    )
    database_url = f"sqlite+pysqlite:///{tmp_path / 'ready.db'}"
    swaps = DexSwapRepository(database_url, create_schema=True)
    claims = RewardRepository(database_url, create_schema=True)
    adapter = DevnetAdapter(program, signer)

    ready = check_devnet_readiness(settings, adapter, swaps, claims)
    assert ready["status"] == "ok"
    assert all(ready["checks"].values())

    adapter.genesis = "wrong cluster"
    assert check_devnet_readiness(settings, adapter, swaps, claims)["checks"]["rpc_devnet"] is False
    adapter.genesis = DEVNET_GENESIS
    adapter.signer = None
    without_signer = check_devnet_readiness(settings, adapter, swaps, claims)
    assert without_signer["checks"]["reward_signer"] is False
    assert without_signer["status"] == "ok"


def test_devnet_ready_rejects_unmigrated_database(tmp_path):
    program = str(Keypair().pubkey())
    signer = Keypair()
    settings = Settings(
        _env_file=None,
        solana_network="devnet",
        solana_program_id=program,
    )
    database_url = f"sqlite+pysqlite:///{tmp_path / 'empty.db'}"
    swaps = DexSwapRepository(database_url, create_schema=False)
    claims = RewardRepository(database_url, create_schema=False)

    report = check_devnet_readiness(settings, DevnetAdapter(program, signer), swaps, claims)
    assert report["status"] == "unavailable"
    assert report["checks"]["database"] is False


def test_managed_postgres_url_uses_installed_driver():
    settings = Settings(_env_file=None, database_url="postgresql://user:password@db/gamefi")
    assert settings.database_url == "postgresql+psycopg://user:password@db/gamefi"


class ReadyAdapter(DevnetAdapter):
    def __init__(self, program_id, sol_lamports=100_000_000, vault_ui=5000.0):
        super().__init__(program_id, Keypair())
        self.sol_lamports = sol_lamports
        self.vault_ui = vault_ui

    def _rpc(self, method, params):
        if method == "getHealth":
            return "ok"
        if method == "getBalance":
            return {"value": self.sol_lamports}
        if method == "getTokenAccountsByOwner":
            return {"value": [{
                "account": {"data": {"parsed": {"info": {"tokenAmount": {"uiAmount": self.vault_ui}}}}},
            }]}
        return super()._rpc(method, params)

    def get_native_balance(self, wallet: str) -> int:
        result = self._rpc("getBalance", [wallet, {"commitment": "confirmed"}])
        return int(result["value"])


def ready_settings(tmp_path, signer, program, **overrides):
    import json as _json
    keypair_path = tmp_path / "signer.json"
    keypair_path.write_text(_json.dumps(list(bytes(signer))), encoding="utf-8")
    database_url = f"sqlite+pysqlite:///{tmp_path / 'ready2.db'}"
    swaps = DexSwapRepository(database_url, create_schema=True)
    claims = RewardRepository(database_url, create_schema=True)
    kwargs = dict(
        solana_network="devnet",
        solana_program_id=program,
        solana_rpc_url="https://api.devnet.solana.com",
        database_url=database_url,
        reward_distributor_keypair_path=str(keypair_path),
        reward_distributor_authority=str(signer.pubkey()),
    )
    kwargs.update(overrides)
    settings = Settings(_env_file=None, **kwargs)
    return settings, swaps, claims


def test_deployment_ready_requires_all_checks(tmp_path):
    import app.core.readiness as readiness_mod
    readiness_mod._readiness_cache = None
    program = str(Keypair().pubkey())
    signer = Keypair()
    settings, swaps, claims = ready_settings(tmp_path, signer, program)
    report = check_deployment_readiness(settings, ReadyAdapter(program), swaps, claims)
    assert report["status"] == "ok", report
    assert all(report["checks"].values()), report
    assert "private" not in str(report).lower() and "DATABASE_URL" not in str(report)


def test_deployment_ready_503_when_program_missing(tmp_path):
    import app.core.readiness as readiness_mod
    readiness_mod._readiness_cache = None
    program = str(Keypair().pubkey())
    signer = Keypair()
    settings, swaps, claims = ready_settings(tmp_path, signer, program, solana_program_id="")
    report = check_deployment_readiness(settings, ReadyAdapter(program), swaps, claims)
    assert report["status"] == "unavailable"
    assert report["details"]["missing_env"] and "SOLANA_PROGRAM_ID" in report["details"]["missing_env"]
    assert report["checks"]["program"] is False

    readiness_mod._readiness_cache = None
    settings, swaps, claims = ready_settings(tmp_path, signer, program)
    bad = ReadyAdapter("11111111111111111111111111111111")
    report = check_deployment_readiness(settings, bad, swaps, claims)
    assert report["status"] == "unavailable" and report["checks"]["program"] is False


def test_deployment_ready_503_when_signer_wrong(tmp_path):
    import app.core.readiness as readiness_mod
    readiness_mod._readiness_cache = None
    program = str(Keypair().pubkey())
    signer = Keypair()
    settings, swaps, claims = ready_settings(tmp_path, signer, program)
    settings.reward_distributor_authority = str(Keypair().pubkey())
    report = check_deployment_readiness(settings, ReadyAdapter(program), swaps, claims)
    assert report["status"] == "unavailable" and report["checks"]["signer"] is False


def test_devnet_configuration_lists_missing_vars():
    settings = Settings(_env_file=None, solana_program_id="", solana_network="devnet")
    _, missing = check_devnet_configuration(settings)
    assert "SOLANA_PROGRAM_ID" in missing


def test_startup_fail_fast_lists_missing_vars_and_bad_signer(tmp_path):
    from app import main
    from app.core.reward_signer import RewardSignerError

    main.validate_devnet_deployment(Settings(_env_file=None, devnet_deployed=False))
    broken = Settings(
        _env_file=None, devnet_deployed=True, solana_program_id="",
        reward_distributor_keypair_path=str(tmp_path / "missing.json"),
    )
    try:
        main.validate_devnet_deployment(broken)
    except RewardSignerError as exc:
        assert "SOLANA_PROGRAM_ID" in str(exc) and "SIGNER" in str(exc)
    else:
        raise AssertionError("expected fail fast")
