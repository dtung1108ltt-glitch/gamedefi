import importlib.util
import io
import json
from pathlib import Path

import pytest


SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "smoke-devnet-deployment.py"
spec = importlib.util.spec_from_file_location("smoke_devnet_deployment", SCRIPT)
smoke = importlib.util.module_from_spec(spec)
spec.loader.exec_module(smoke)


class Response(io.BytesIO):
    status = 200


def test_devnet_smoke_checks_the_expected_program_tokens_pools_and_readiness(monkeypatch):
    api = "https://api.example.test"
    site = "https://game.example.test"
    payloads = {
        site + "/": b'<html><div id="root"></div></html>',
        api + "/health/ready": {
            "status": "ok", "network": "devnet",
            "checks": {"rpc_devnet": True, "program": True, "reward_signer": False, "database": True},
        },
        api + "/blockchain/solana/config": {"network": "devnet", "program_id": smoke.PROGRAM_ID},
        api + "/blockchain/solana/reward-wallet": {"configured": False, "active": False},
        api + "/dex/config": {
            "network": "devnet", "provider": "raydium", "pools": smoke.RAYDIUM_POOLS,
            "tokens": [{"symbol": "SOL", "mint": "So11111111111111111111111111111111111111112"},
                       *({"symbol": symbol, "mint": mint} for symbol, mint in smoke.TEST_MINTS.items())],
            "supports_execution": True, "persistence": "sql",
        },
    }

    def fake_urlopen(url, timeout):
        assert timeout == 20
        value = payloads[url]
        return Response(value if isinstance(value, bytes) else json.dumps(value).encode())

    monkeypatch.setattr(smoke, "urlopen", fake_urlopen)
    smoke.validate(api, site)

    payloads[api + "/dex/config"]["pools"] = {"USDC": "wrong-pool"}
    with pytest.raises(ValueError, match="expected Devnet pools"):
        smoke.validate(api, site)
