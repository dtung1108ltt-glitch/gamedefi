#!/usr/bin/env python3
"""Read-only smoke check for a deployed GameFi Devnet frontend and API."""

import argparse
import json
import sys
from urllib.parse import urlparse
from urllib.request import urlopen


PROGRAM_ID = "8qUBTgX99v5EhxbAaxuqS94rgfRhnLrTgW66Gh9BvLKN"
TEST_MINTS = {
    "USDC": "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    "USDT": "9jWfcfEZToquBQmkoEViNSCt72veXwcvRGFQERXRjEk1",
}
RAYDIUM_POOLS = {
    "USDC": "FeRts7d5DfXKXq1hGMkeiGEHayDdjsmSyJ41rHVcKo8t",
    "USDT": "Bw9gaeKqQy5aTpi1BiSdV2p21REATtVXDdhjPUFjgq6N",
}


def deployed_url(value: str) -> str:
    parsed = urlparse(value)
    if (parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password
            or parsed.query or parsed.fragment):
        raise argparse.ArgumentTypeError("Use a public HTTPS URL without credentials")
    return value.rstrip("/")


def get_json(base: str, path: str) -> dict:
    with urlopen(base + path, timeout=20) as response:
        if response.status != 200:
            raise ValueError(f"{path} returned HTTP {response.status}")
        return json.load(response)


def validate(api: str, site: str) -> None:
    with urlopen(site + "/", timeout=20) as response:
        page = response.read(200_000).decode("utf-8")
        if response.status != 200 or '<div id="root"></div>' not in page:
            raise ValueError("Frontend entry point is unavailable")

    ready = get_json(api, "/health/ready")
    required = {"rpc_devnet", "program", "database"}
    if ready.get("network") != "devnet" or ready.get("status") != "ok":
        raise ValueError("Backend is not ready on Devnet")
    if not required.issubset(ready.get("checks", {})) or not all(ready["checks"][key] for key in required):
        raise ValueError("Backend readiness checks are incomplete")

    config = get_json(api, "/blockchain/solana/config")
    if config.get("network") != "devnet" or config.get("program_id") != PROGRAM_ID:
        raise ValueError("Solana Devnet program ID does not match the deployment record")

    get_json(api, "/blockchain/solana/reward-wallet")
    dex = get_json(api, "/dex/config")
    tokens = {token["symbol"]: token["mint"] for token in dex.get("tokens", [])}
    if (
        dex.get("network") != "devnet"
        or dex.get("provider") != "raydium"
        or dex.get("pools") != RAYDIUM_POOLS
        or not all(tokens.get(symbol) == mint for symbol, mint in TEST_MINTS.items())
        or set(tokens) != {"SOL", "USDC", "USDT"}
        or dex.get("supports_execution") is not True
        or dex.get("persistence") != "sql"
    ):
        raise ValueError("DEX is not using the expected Devnet pools, tokens and SQL persistence")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api-url", required=True, type=deployed_url)
    parser.add_argument("--site-url", required=True, type=deployed_url)
    args = parser.parse_args()
    try:
        validate(args.api_url, args.site_url)
    except Exception as exc:
        print(f"Devnet smoke check failed: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 1
    print("Devnet frontend, API, Solana program, SOL reward status and DEX verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
