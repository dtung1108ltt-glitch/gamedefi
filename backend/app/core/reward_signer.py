"""Locate, read and validate the backend-only reward distributor signer.

This module never logs or returns key material: failures describe the resolved path
and the concrete reason only (missing file, unreadable, wrong JSON shape, mismatch
with the configured authority).
"""
from __future__ import annotations

import json
from pathlib import Path

from solders.keypair import Keypair

from app.core.config import Settings, config_path_candidates


KEYPAIR_BYTES = 64
KEYGEN_HINT = "solana-keygen new --outfile backend/keys/reward-distributor.json"


def _keypair_from_values(values: list[int], *, source: str) -> Keypair:
    if not isinstance(values, list) or any(isinstance(value, bool) or not isinstance(value, int) for value in values):
        raise RewardSignerError(
            f"Signer reward distributor tại {source} phải là JSON array gồm 64 số nguyên 0-255"
        )
    if len(values) != KEYPAIR_BYTES:
        raise RewardSignerError(
            f"Signer reward distributor tại {source} có {len(values)} byte, cần đúng {KEYPAIR_BYTES} byte"
        )
    if any(not 0 <= value <= 255 for value in values):
        raise RewardSignerError(
            f"Signer reward distributor tại {source} chứa giá trị ngoài khoảng 0-255"
        )
    try:
        return Keypair.from_bytes(bytes(values))
    except ValueError as exc:
        raise RewardSignerError(
            f"Signer reward distributor tại {source} không tạo được Solana keypair hợp lệ: {exc}"
        ) from exc


def _check_authority(keypair: Keypair, authority: str, *, source: str) -> Keypair:
    if str(keypair.pubkey()) != authority:
        raise RewardSignerError(
            f"Keypair reward distributor tại {source} có public key {keypair.pubkey()} "
            f"không khớp REWARD_DISTRIBUTOR_AUTHORITY {authority}"
        )
    return keypair


class RewardSignerError(RuntimeError):
    """Raised when the configured reward distributor signer cannot be used."""


def signer_path_candidates(settings: Settings) -> list[Path]:
    """Absolute paths worth trying for the configured signer file."""
    try:
        return config_path_candidates(settings.reward_distributor_keypair_path)
    except ValueError as exc:
        raise RewardSignerError("REWARD_DISTRIBUTOR_KEYPAIR_PATH chưa được cấu hình") from exc


def load_reward_distributor_keypair(settings: Settings) -> Keypair:
    """Read the signer from disk and verify it against the configured authority.

    Absolute paths (Render Secret File, e.g. /etc/secrets/...) are used as-is.
    When no file exists, REWARD_DISTRIBUTOR_KEYPAIR_JSON is used as fallback.
    The env value is never logged.
    """
    candidates = signer_path_candidates(settings)
    target = next((candidate for candidate in candidates if candidate.exists()), None)
    if target is not None:
        keypair = _keypair_from_values(_read_keypair_values(target), source=str(target))
        return _check_authority(keypair, settings.reward_distributor_authority, source=str(target))
    raw_json = (settings.reward_distributor_keypair_json or "").strip()
    if raw_json:
        try:
            values = json.loads(raw_json)
        except json.JSONDecodeError as exc:
            raise RewardSignerError(
                "REWARD_DISTRIBUTOR_KEYPAIR_JSON không phải JSON hợp lệ; cần JSON array gồm 64 số 0-255"
            ) from exc
        keypair = _keypair_from_values(values, source="REWARD_DISTRIBUTOR_KEYPAIR_JSON")
        return _check_authority(keypair, settings.reward_distributor_authority, source="REWARD_DISTRIBUTOR_KEYPAIR_JSON")
    tried = " hoặc ".join(str(candidate) for candidate in candidates)
    raise RewardSignerError(
        f"Không tìm thấy file keypair reward distributor. Đã thử đọc {tried} "
        f"(REWARD_DISTRIBUTOR_KEYPAIR_PATH={settings.reward_distributor_keypair_path}). "
        f"Tạo signer Devnet bằng: {KEYGEN_HINT}"
    )


def validate_reward_distributor_signer(settings: Settings) -> str | None:
    """Return a human-readable problem description, or None when the signer is ready."""
    try:
        load_reward_distributor_keypair(settings)
    except RewardSignerError as exc:
        return str(exc)
    return None


def reward_signer_required_at_startup(settings: Settings) -> bool:
    """Deployed environments must not start without a usable signer."""
    return settings.solana_network == "mainnet-beta" or settings.devnet_deployed


def _read_keypair_values(path: Path) -> list[int]:
    if path.is_dir():
        raise RewardSignerError(f"{path} là thư mục, không phải file keypair JSON")
    try:
        content = path.read_text(encoding="utf-8")
    except PermissionError as exc:
        raise RewardSignerError(f"Không có quyền đọc file keypair reward distributor tại {path}") from exc
    except OSError as exc:
        raise RewardSignerError(f"Không đọc được file keypair reward distributor tại {path}: {exc}") from exc
    try:
        raw = json.loads(content)
    except json.JSONDecodeError as exc:
        raise RewardSignerError(
            f"File keypair reward distributor tại {path} không phải JSON hợp lệ "
            f"(dòng {exc.lineno}, cột {exc.colno}: {exc.msg}); cần JSON array gồm 64 số 0-255"
        ) from exc
    return raw


def _read_keypair_file(path: Path) -> Keypair:
    return _keypair_from_values(_read_keypair_values(path), source=str(path))
