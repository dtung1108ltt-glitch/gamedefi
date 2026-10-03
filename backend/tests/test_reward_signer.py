import json
from pathlib import Path

import pytest
from solders.keypair import Keypair

from app.blockchain.solana_adapter import SolanaAdapter, SolanaAdapterError
from app.core.config import BACKEND_DIR, PROJECT_DIR, Settings, config_path_candidates
from app.core.reward_signer import (
    RewardSignerError,
    load_reward_distributor_keypair,
    reward_signer_required_at_startup,
    validate_reward_distributor_signer,
)


def write_keypair(path: Path, keypair: Keypair) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(list(bytes(keypair))), encoding="utf-8")
    return path


def signer_settings(signer: Keypair, keypair_path: Path) -> Settings:
    return Settings(
        reward_distributor_keypair_path=str(keypair_path),
        reward_distributor_authority=str(signer.pubkey()),
    )


def test_relative_signer_path_ignores_working_directory(monkeypatch, tmp_path):
    monkeypatch.chdir(tmp_path)
    assert config_path_candidates("backend/keys/reward-distributor.json") == [
        PROJECT_DIR / "backend" / "keys" / "reward-distributor.json"
    ]
    assert config_path_candidates("keys/reward-distributor.json") == [
        PROJECT_DIR / "keys" / "reward-distributor.json",
        BACKEND_DIR / "keys" / "reward-distributor.json",
    ]


def test_absolute_and_home_paths_are_used_as_is():
    assert config_path_candidates("~/signer.json") == [Path.home() / "signer.json"]
    assert config_path_candidates(str(Path.home() / "signer.json")) == [Path.home() / "signer.json"]


def test_empty_signer_path_is_rejected():
    with pytest.raises(ValueError):
        config_path_candidates("   ")


def test_loads_signer_matching_configured_authority(tmp_path):
    signer = Keypair()
    settings = signer_settings(signer, write_keypair(tmp_path / "keys" / "reward.json", signer))
    assert load_reward_distributor_keypair(settings).pubkey() == signer.pubkey()
    assert validate_reward_distributor_signer(settings) is None


def test_reports_resolved_path_when_file_is_missing(tmp_path):
    missing = tmp_path / "keys" / "reward-distributor.json"
    message = validate_reward_distributor_signer(Settings(reward_distributor_keypair_path=str(missing)))
    assert str(missing) in message
    assert "Không tìm thấy file keypair" in message
    assert "solana-keygen new" in message


@pytest.mark.parametrize(
    ("payload", "expected"),
    [
        ("{broken", "không phải JSON hợp lệ"),
        (json.dumps({"a": 1}), "phải là JSON array"),
        (json.dumps([1, 2, 3]), "có 3 byte, cần đúng 64 byte"),
        (json.dumps(["0"] * 64), "phải là JSON array gồm 64 số nguyên 0-255"),
        (json.dumps([0] * 63 + [300]), "ngoài khoảng 0-255"),
        (json.dumps([0] * 64), "không tạo được Solana keypair hợp lệ"),
    ],
)
def test_reports_specific_keypair_format_errors(tmp_path, payload, expected):
    path = tmp_path / "signer.json"
    path.write_text(payload, encoding="utf-8")
    message = validate_reward_distributor_signer(signer_settings(Keypair(), path))
    assert str(path) in message
    assert expected in message


def test_keypair_json_env_fallback_is_used_when_file_missing(tmp_path):
    import json as _json
    signer = Keypair()
    missing = tmp_path / "absent.json"
    settings = Settings(
        _env_file=None,
        reward_distributor_keypair_path=str(missing),
        reward_distributor_authority=str(signer.pubkey()),
        reward_distributor_keypair_json=_json.dumps(list(bytes(signer))),
    )
    assert validate_reward_distributor_signer(settings) is None
    # Env fallback không được log giá trị: message lỗi khác không chứa nội dung keypair.
    bad = Settings(
        _env_file=None,
        reward_distributor_keypair_path=str(missing),
        reward_distributor_authority=str(Keypair().pubkey()),
        reward_distributor_keypair_json=_json.dumps(list(bytes(signer))),
    )
    message = validate_reward_distributor_signer(bad)
    assert "không khớp REWARD_DISTRIBUTOR_AUTHORITY" in message
    assert _json.dumps(list(bytes(signer))) not in message


def test_rejects_signer_that_does_not_match_authority(tmp_path):
    settings = signer_settings(Keypair(), write_keypair(tmp_path / "signer.json", Keypair()))
    with pytest.raises(RewardSignerError, match="không khớp REWARD_DISTRIBUTOR_AUTHORITY"):
        load_reward_distributor_keypair(settings)
    assert "không khớp REWARD_DISTRIBUTOR_AUTHORITY" in validate_reward_distributor_signer(settings)


def test_directory_instead_of_signer_file_is_reported(tmp_path):
    target = tmp_path / "keys"
    target.mkdir()
    message = validate_reward_distributor_signer(Settings(reward_distributor_keypair_path=str(target)))
    assert str(target) in message
    assert "là thư mục" in message


def test_adapter_reports_signer_path_and_reason(tmp_path):
    missing = tmp_path / "missing.json"
    adapter = SolanaAdapter(Settings(reward_distributor_keypair_path=str(missing)))
    with pytest.raises(SolanaAdapterError) as excinfo:
        adapter._load_reward_distributor_keypair()
    assert str(missing) in str(excinfo.value)
    assert "Không tìm thấy file keypair reward distributor" in str(excinfo.value)
    assert "Đã thử đọc" in str(excinfo.value)


def test_startup_requires_signer_only_for_deployments():
    assert reward_signer_required_at_startup(Settings(solana_network="devnet")) is False
    assert reward_signer_required_at_startup(Settings(solana_network="devnet", devnet_deployed=True)) is True
    assert reward_signer_required_at_startup(Settings(solana_network="mainnet-beta")) is True


def test_create_app_fails_fast_when_deployed_without_signer(monkeypatch, tmp_path):
    from app import main

    broken = Settings(devnet_deployed=True, reward_distributor_keypair_path=str(tmp_path / "missing.json"))
    monkeypatch.setattr(main, "get_settings", lambda: broken)
    with pytest.raises(RewardSignerError):
        main.create_app()
