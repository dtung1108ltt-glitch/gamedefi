from app.core.store import store
from conftest import login, login_solana, make_wallet, sign_message


def auth_headers(player: dict) -> dict[str, str]:
    return {"Authorization": f"Bearer {player['access_token']}"}


def register_faction(client, adapter, wallet: str, player: dict, faction_id: int = 5) -> None:
    digest, object_id = adapter.mint_faction(wallet, faction_id)
    response = client.post(
        f"/players/{wallet}/faction",
        headers=auth_headers(player),
        json={"faction_id": faction_id, "nft_object_id": object_id, "tx_digest": digest},
    )
    assert response.status_code == 200, response.text


def win_battle(client, wallet: str, player: dict) -> str:
    response = client.post(
        "/battles",
        headers=auth_headers(player),
        json={
            "player_wallet": wallet,
            "scenario_id": "bach_dang_1288",
            "tactical_formation": "defensive",
            "advisor_id": "tran_hung_dao",
        },
    )
    assert response.status_code == 200, response.text
    assert response.json()["victory"] is True
    return response.json()["battle_id"]


def test_nonce_then_verify_creates_player_with_session(client):
    wallet, player = login(client)
    assert player["wallet"] == wallet
    assert player["chain"] == "solana"
    assert player["access_token"]
    assert client.get(f"/players/{wallet}").status_code == 200


def test_verify_rejects_bad_signature(client):
    signing_key, wallet = make_wallet()
    nonce_resp = client.post("/auth/nonce", json={"chain": "solana", "wallet": wallet}).json()
    response = client.post(
        "/auth/wallet",
        json={
            "chain": "solana",
            "wallet": wallet,
            "nonce": nonce_resp["nonce"],
            "message": nonce_resp["message"],
            "signature": sign_message(signing_key, "message khác hoàn toàn"),
        },
    )
    assert response.status_code == 401
    response = client.post(
        "/auth/wallet",
        json={
            "chain": "solana",
            "wallet": wallet,
            "nonce": nonce_resp["nonce"],
            "message": nonce_resp["message"],
            "signature": sign_message(signing_key, nonce_resp["message"]),
        },
    )
    assert response.status_code == 200


def test_verify_rejects_reused_nonce(client):
    signing_key, wallet = make_wallet()
    nonce_resp = client.post("/auth/nonce", json={"chain": "solana", "wallet": wallet}).json()
    body = {
        "chain": "solana",
        "wallet": wallet,
        "nonce": nonce_resp["nonce"],
        "message": nonce_resp["message"],
        "signature": sign_message(signing_key, nonce_resp["message"]),
    }
    assert client.post("/auth/wallet", json=body).status_code == 200
    assert client.post("/auth/wallet", json=body).status_code == 400


def test_nonce_rejects_unsupported_chain(client):
    assert client.post("/auth/nonce", json={"chain": "bitcoin", "wallet": "abc"}).status_code == 422
    assert client.post("/auth/nonce", json={"chain": "ethereum", "wallet": "0xabc"}).status_code == 422


def test_nonce_rejects_invalid_solana_wallet(client):
    assert client.post("/auth/nonce", json={"chain": "solana", "wallet": "not-a-wallet"}).status_code == 422


def test_multiple_nonce_prompts_for_same_wallet_remain_valid(client):
    signing_key, wallet = make_wallet()
    first = client.post("/auth/nonce", json={"chain": "solana", "wallet": wallet}).json()
    second = client.post("/auth/nonce", json={"chain": "solana", "wallet": wallet}).json()
    assert first["nonce"] != second["nonce"]
    for challenge in (first, second):
        response = client.post(
            "/auth/wallet",
            json={
                "chain": "solana",
                "wallet": wallet,
                **challenge,
                "signature": sign_message(signing_key, challenge["message"]),
            },
        )
        assert response.status_code == 200


def test_public_blockchain_config_is_solana_only(client):
    response = client.get("/blockchain/solana/config")
    assert response.status_code == 200
    assert response.json()["chain"] == "solana"
    body = response.json()
    assert {"chain", "network", "program_id", "configured", "program_deployed",
            "error_code", "message"} <= set(body)
    assert client.get("/blockchain/ethereum/transaction/anything").status_code == 404


def test_solana_config_reports_error_codes(monkeypatch):
    from types import SimpleNamespace
    from fastapi.testclient import TestClient
    import app.api.blockchain as blockchain_api
    from app.main import create_app
    import app.blockchain.solana_adapter as adapter_mod

    def make_settings(program_id: str):
        return SimpleNamespace(solana_program_id=program_id, solana_network="devnet")

    monkeypatch.setattr(blockchain_api, "get_settings", lambda: make_settings("11111111111111111111111111111111"))
    blockchain_api._config_cache = None
    client = TestClient(create_app())
    body = client.get("/blockchain/solana/config").json()
    assert body["error_code"] == "INVALID_PROGRAM_ID"
    assert body["configured"] is False

    monkeypatch.setattr(
        adapter_mod.SolanaAdapter, "_rpc",
        lambda self, method, params: {"value": {"executable": True, "owner": "x"}},
    )
    monkeypatch.setattr(
        blockchain_api, "get_settings",
        lambda: make_settings("8qUBTgX99v5EhxbAaxuqS94rgfRhnLrTgW66Gh9BvLKN"),
    )
    blockchain_api._config_cache = None
    body = client.get("/blockchain/solana/config").json()
    assert body["configured"] is True and body["program_deployed"] is True
    assert body["error_code"] is None

    monkeypatch.setattr(
        adapter_mod.SolanaAdapter, "_rpc",
        lambda self, method, params: {"value": None},
    )
    blockchain_api._config_cache = None
    body = client.get("/blockchain/solana/config").json()
    assert body["error_code"] == "PROGRAM_NOT_DEPLOYED"

    def boom(self, method, params):
        raise RuntimeError("rpc down")
    monkeypatch.setattr(adapter_mod.SolanaAdapter, "_rpc", boom)
    blockchain_api._config_cache = None
    body = client.get("/blockchain/solana/config").json()
    assert body["error_code"] == "RPC_UNREACHABLE"
    blockchain_api._config_cache = None


def test_state_changing_routes_require_matching_session(client, adapter):
    owner_wallet, _owner = login(client)
    other_wallet, other = login(client)
    digest, object_id = adapter.mint_faction(owner_wallet, 5)
    body = {"faction_id": 5, "nft_object_id": object_id, "tx_digest": digest}
    assert client.post(f"/players/{owner_wallet}/faction", json=body).status_code == 401
    assert client.post(f"/players/{owner_wallet}/faction", headers=auth_headers(other), json=body).status_code == 403
    assert other_wallet != owner_wallet


def test_faction_registration_requires_matching_onchain_nft(client, adapter):
    wallet, player = login(client)
    digest, object_id = adapter.mint_faction(wallet, 1)
    response = client.post(
        f"/players/{wallet}/faction",
        headers=auth_headers(player),
        json={"faction_id": 2, "nft_object_id": object_id, "tx_digest": digest},
    )
    assert response.status_code == 400


def test_faction_registration_rejects_transaction_from_another_wallet(client, adapter):
    wallet, player = login(client)
    digest, object_id = adapter.mint_faction(wallet, 5)
    adapter.txs[digest].sender = "another-solana-wallet"
    response = client.post(
        f"/players/{wallet}/faction",
        headers=auth_headers(player),
        json={"faction_id": 5, "nft_object_id": object_id, "tx_digest": digest},
    )
    assert response.status_code == 400
    assert "mint_faction" in response.json()["detail"]


def test_faction_registration_rejects_unrelated_successful_transaction(client, adapter):
    wallet, player = login(client)
    digest, object_id = adapter.mint_faction(wallet, 5)
    adapter.txs[digest].events = []
    response = client.post(
        f"/players/{wallet}/faction",
        headers=auth_headers(player),
        json={"faction_id": 5, "nft_object_id": object_id, "tx_digest": digest},
    )
    assert response.status_code == 400


def test_battle_reward_id_is_stable_within_daily_period(client, adapter):
    wallet, player = login(client)
    register_faction(client, adapter, wallet, player)
    first = win_battle(client, wallet, player)
    second = win_battle(client, wallet, player)
    assert second == first


def test_losing_battle_does_not_consume_daily_winning_reward(client, adapter):
    wallet, player = login(client)
    register_faction(client, adapter, wallet, player)
    store.get_army(wallet).total_power = 500
    loss = client.post(
        "/battles",
        headers=auth_headers(player),
        json={
            "player_wallet": wallet,
            "scenario_id": "ngoc_hoi_1789",
            "tactical_formation": "standard",
        },
    )
    assert loss.status_code == 200, loss.text
    assert loss.json()["victory"] is False
    assert client.post(
        "/rewards/claim",
        headers=auth_headers(player),
        json={"wallet": wallet, "battle_id": loss.json()["battle_id"]},
    ).status_code == 404

    winning_battle_id = win_battle(client, wallet, player)
    assert winning_battle_id != loss.json()["battle_id"]
    assert client.post(
        "/rewards/claim",
        headers=auth_headers(player),
        json={"wallet": wallet, "battle_id": winning_battle_id},
    ).status_code == 200

def test_claim_reports_resolved_signer_path_when_keypair_is_missing(client, adapter, tmp_path):
    from app.blockchain.solana_adapter import SolanaAdapter
    from app.core.config import Settings
    from conftest import StubResolver

    missing = tmp_path / "keys" / "reward-distributor.json"
    wallet, player = login(client)
    register_faction(client, adapter, wallet, player)
    battle_id = win_battle(client, wallet, player)

    # Payout signer file absent: the claim must fail with the resolved path and reason
    # instead of a generic error, while the recorded victory stays in PostgreSQL.
    client.app.state.resolver = StubResolver(
        SolanaAdapter(Settings(reward_distributor_keypair_path=str(missing)))
    )
    response = client.post(
        "/rewards/claim",
        headers=auth_headers(player),
        json={"wallet": wallet, "battle_id": battle_id},
    )
    assert response.status_code == 503, response.text
    detail = response.json()["detail"]
    assert str(missing) in detail
    assert "Không tìm thấy file keypair reward distributor" in detail

    history = client.get(f"/players/{wallet}/rewards", headers=auth_headers(player))
    assert history.status_code == 200
    assert history.json()[0]["status"] == "failed"


def test_reward_requires_owned_winning_battle_and_is_single_use(client, adapter):
    wallet, player = login(client)
    register_faction(client, adapter, wallet, player)
    battle_id = win_battle(client, wallet, player)
    headers = auth_headers(player)
    assert client.post(
        "/rewards/claim", headers=headers, json={"wallet": wallet, "battle_id": "battle-does-not-exist"}
    ).status_code == 404

    response = client.post("/rewards/claim", headers=headers, json={"wallet": wallet, "battle_id": battle_id})
    assert response.status_code == 200, response.text
    payload = response.json()
    digest = payload["tx_digest"]
    assert payload["battle_id"] == battle_id
    assert payload["source_type"] == "battle"
    assert payload["status"] == "confirmed"
    assert payload["asset_symbol"] == "SOL"
    assert payload["amount"] == 100_000

    repeated = client.post("/rewards/claim", headers=headers, json={"wallet": wallet, "battle_id": battle_id})
    assert repeated.status_code == 200
    assert repeated.json()["claim_id"] == payload["claim_id"]
    assert repeated.json()["tx_digest"] == digest
    assert client.get(f"/blockchain/solana/transaction/{digest}").status_code == 200
    history = client.get(f"/players/{wallet}/rewards", headers=headers)
    assert history.status_code == 200
    assert len(history.json()) == 1


def test_solana_login_uses_base58_signature(client):
    wallet, player = login_solana(client)
    assert player["chain"] == "solana"
    assert player["wallet"] == wallet
    assert player["access_token"]


def test_completed_quest_claim_is_idempotent(client, adapter):
    wallet, player = login(client)
    register_faction(client, adapter, wallet, player, faction_id=5)
    win_battle(client, wallet, player)
    headers = auth_headers(player)

    quests = client.get(f"/quests/players/{wallet}", headers=headers)
    assert quests.status_code == 200
    quest = next(item for item in quests.json() if item["id"] == "quest_bach_dang_1288")
    assert quest["completed"] is True
    assert quest["completed_battles"] == 1

    first = client.post(
        "/rewards/quests/claim",
        headers=headers,
        json={"wallet": wallet, "quest_id": quest["id"]},
    )
    assert first.status_code == 200, first.text
    assert first.json()["source_type"] == "quest"
    assert first.json()["status"] == "confirmed"
    assert first.json()["asset_symbol"] == "SOL"
    assert first.json()["amount"] == 200_000
    repeated = client.post(
        "/rewards/quests/claim",
        headers=headers,
        json={"wallet": wallet, "quest_id": quest["id"]},
    )
    assert repeated.status_code == 200
    assert repeated.json()["claim_id"] == first.json()["claim_id"]
