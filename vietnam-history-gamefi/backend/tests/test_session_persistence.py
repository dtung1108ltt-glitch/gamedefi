"""A valid browser login must survive a backend process restart."""

import sqlite3
from pathlib import Path

from fastapi.testclient import TestClient

from app.core.security import SessionStore
from app.core import security
from app.core.store import Store, store
from app.main import create_app
from conftest import make_wallet, sign_message


def test_guest_session_and_player_survive_app_restart(tmp_path):
    database = tmp_path / "sessions.db"
    url = f"sqlite+pysqlite:///{database.as_posix()}"
    migration = Path(__file__).resolve().parents[2] / "database" / "migrations" / "005_auth_sessions.sql"
    with sqlite3.connect(database) as db:
        db.executescript(migration.read_text(encoding="utf-8"))

    first = create_app()
    first.state.session_store = SessionStore(3600, url)
    with TestClient(first) as client:
        login = client.post("/auth/guest", json={"username": "Tester"})
        assert login.status_code == 200
        player = login.json()
        token = player["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        selected = client.post(
            f"/players/{player['wallet']}/faction/select",
            json={"faction_id": 1}, headers=headers,
        )
        assert selected.status_code == 200
        assert selected.json()["faction_id"] == 1

    with sqlite3.connect(database) as db:
        stored_hash = db.execute("SELECT token_hash FROM auth_sessions").fetchone()[0]
        assert stored_hash != token
        assert len(stored_hash) == 64

    # Simulate Render replacing the Python process and all in-memory state.
    store.__dict__.update(Store().__dict__)
    restarted = create_app()
    restarted.state.session_store = SessionStore(3600, url)
    with TestClient(restarted) as client:
        headers = {"Authorization": f"Bearer {token}"}
        resumed = client.get("/auth/session", headers=headers)
        assert resumed.status_code == 200
        assert resumed.json()["wallet"] == player["wallet"]
        assert resumed.json()["faction_id"] == 1
        assert client.get(f"/players/{player['wallet']}/army", headers=headers).status_code == 200
        assert client.get("/auth/session", headers={"Authorization": "Bearer wrong"}).status_code == 401


def test_signed_wallet_session_survives_app_restart(tmp_path):
    database = tmp_path / "wallet-sessions.db"
    url = f"sqlite+pysqlite:///{database.as_posix()}"
    key, wallet = make_wallet()

    first = create_app()
    first.state.session_store = SessionStore(3600, url, create_schema=True)
    with TestClient(first) as client:
        challenge = client.post("/auth/nonce", json={"chain": "solana", "wallet": wallet}).json()
        signed = client.post("/auth/wallet", json={
            "chain": "solana", "wallet": wallet, **challenge,
            "signature": sign_message(key, challenge["message"]),
        })
        assert signed.status_code == 200
        token = signed.json()["access_token"]

    store.__dict__.update(Store().__dict__)
    restarted = create_app()
    restarted.state.session_store = SessionStore(3600, url)
    with TestClient(restarted) as client:
        headers = {"Authorization": f"Bearer {token}"}
        resumed = client.get("/auth/session", headers=headers)
        assert resumed.status_code == 200
        assert resumed.json()["wallet"] == wallet
        assert resumed.json()["is_guest"] is False
        assert client.get(f"/quests/players/{wallet}", headers=headers).status_code == 200


def test_session_renews_while_active_and_expires_after_inactivity(monkeypatch):
    clock = {"now": 1_000}
    monkeypatch.setattr(security.time, "time", lambda: clock["now"])
    sessions = SessionStore(100, "sqlite+pysqlite://", create_schema=True)
    token = sessions.create("solana", "wallet")

    clock["now"] = 1_060
    assert sessions.get(token) is not None
    clock["now"] = 1_130
    assert sessions.get(token) is not None
    clock["now"] = 1_230
    assert sessions.get(token) is None
