#!/usr/bin/env python3
"""Kiểm tra sau deploy: /health, /health/ready, /blockchain/solana/config.

Nhận BASE_URL (ví dụ https://haokhi-devnet.onrender.com/api), in PASS/FAIL từng mục,
thoát mã khác 0 khi thất bại. Chỉ đọc, không gửi giao dịch.
"""

import argparse
import json
import sys
from urllib.parse import urlparse
from urllib.request import Request, urlopen


def base_url(value: str) -> str:
    parsed = urlparse(value)
    if parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password:
        raise argparse.ArgumentTypeError("BASE_URL phải là HTTPS công khai, không kèm credentials")
    return value.rstrip("/")


def get_json(base: str, path: str) -> tuple[int, dict | None]:
    request = Request(base + path, headers={"Accept": "application/json"})
    try:
        with urlopen(request, timeout=20) as response:
            try:
                return response.status, json.load(response)
            except json.JSONDecodeError:
                return response.status, None
    except Exception as exc:  # noqa: BLE001 - cần báo lỗi mạng rõ ràng
        print(f"FAIL {path}: không gọi được ({type(exc).__name__})")
        return -1, None


def check(name: str, ok: bool, detail: str = "") -> bool:
    print(f"{'PASS' if ok else 'FAIL'} {name}{f': {detail}' if detail and not ok else ''}")
    return ok


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base_url", type=base_url, help="Ví dụ: https://haokhi-devnet.onrender.com/api")
    args = parser.parse_args()
    base = args.base_url
    passed = True

    status, health = get_json(base, "/health")
    passed &= check("liveness /health", status == 200 and (health or {}).get("status") == "ok")

    status, ready = get_json(base, "/health/ready")
    ready = ready or {}
    checks = ready.get("checks", {}) if isinstance(ready.get("checks"), dict) else {}
    required = {"database", "rpc", "program", "signer", "balances"}
    passed &= check(
        "readiness /health/ready",
        status == 200 and ready.get("status") == "ok" and required.issubset(checks) and all(checks[k] for k in required),
        f"HTTP {status}, checks={checks}",
    )

    status, config = get_json(base, "/blockchain/solana/config")
    config = config or {}
    passed &= check(
        "solana config",
        status == 200 and config.get("configured") is True and config.get("program_deployed") is True
        and config.get("error_code") is None,
        f"HTTP {status}, body={config}",
    )
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
