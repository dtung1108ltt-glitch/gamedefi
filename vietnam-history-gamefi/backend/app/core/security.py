"""Solana wallet authentication: raw Ed25519 messages and base58 signatures."""
from __future__ import annotations

import secrets
import threading
import time
import hashlib
import json
from dataclasses import asdict, dataclass

from sqlalchemy import BigInteger, Boolean, String, Text, create_engine, delete
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker
from sqlalchemy.pool import StaticPool

import base58
from nacl.exceptions import BadSignatureError
from nacl.signing import VerifyKey

LOGIN_MESSAGE_TEMPLATE = "vn-history-gamefi Solana wallet login: {nonce}"
SUPPORTED_CHAINS = ("solana",)


def normalize_wallet(chain: str, wallet: str) -> str:
    """Solana base58 addresses are case-sensitive; never lowercase them."""
    return wallet


def is_valid_solana_wallet(wallet: str) -> bool:
    try:
        return len(base58.b58decode(wallet)) == 32
    except (ValueError, TypeError):
        return False


def verify_solana_message(wallet: str, message: bytes, signature_b58: str) -> bool:
    try:
        public_key = base58.b58decode(wallet)
        signature = base58.b58decode(signature_b58)
        if len(public_key) != 32 or len(signature) != 64:
            return False
        VerifyKey(public_key).verify(message, signature)
        return True
    except (BadSignatureError, ValueError, TypeError):
        return False


def verify_wallet_signature(chain: str, wallet: str, message: bytes, signature: str) -> bool:
    return chain == "solana" and verify_solana_message(wallet, message, signature)


class NonceStore:
    def __init__(self, ttl_seconds: int):
        self.ttl = ttl_seconds
        # Key by nonce so concurrent login prompts for the same wallet do not
        # invalidate each other. The wallet remains part of the stored binding.
        self._nonces: dict[str, tuple[str, str, float]] = {}
        self._lock = threading.Lock()

    def _entry_unlocked(self, chain: str, wallet: str, nonce: str) -> tuple[str, str, float] | None:
        entry = self._nonces.get(nonce)
        if entry is None:
            return None
        stored_chain, stored_wallet, expires_at = entry
        if time.time() >= expires_at:
            self._nonces.pop(nonce, None)
            return None
        if stored_chain != chain or stored_wallet != normalize_wallet(chain, wallet):
            return None
        return entry

    def create(self, chain: str, wallet: str) -> tuple[str, str]:
        nonce = secrets.token_hex(16)
        with self._lock:
            now = time.time()
            self._nonces = {
                key: entry for key, entry in self._nonces.items() if entry[2] > now
            }
            self._nonces[nonce] = (chain, normalize_wallet(chain, wallet), now + self.ttl)
        return nonce, LOGIN_MESSAGE_TEMPLATE.format(nonce=nonce)

    def is_valid(self, chain: str, wallet: str, nonce: str) -> bool:
        with self._lock:
            return self._entry_unlocked(chain, wallet, nonce) is not None

    def consume(self, chain: str, wallet: str, nonce: str) -> bool:
        with self._lock:
            if self._entry_unlocked(chain, wallet, nonce) is None:
                return False
            return self._nonces.pop(nonce, None) is not None


@dataclass(frozen=True)
class SessionPrincipal:
    """Authenticated identity kept server-side and addressed by a bearer token."""

    chain: str
    wallet: str
    is_guest: bool


class SessionBase(DeclarativeBase):
    pass


class SessionModel(SessionBase):
    __tablename__ = "auth_sessions"

    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    chain: Mapped[str] = mapped_column(String(16), nullable=False)
    wallet: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    is_guest: Mapped[bool] = mapped_column(Boolean, nullable=False)
    expires_at: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)


class PlayerProfileModel(SessionBase):
    __tablename__ = "player_profiles"

    chain: Mapped[str] = mapped_column(String(16), primary_key=True)
    wallet: Mapped[str] = mapped_column(String(128), primary_key=True)
    profile_json: Mapped[str] = mapped_column(Text, nullable=False)


class SessionStore:
    """Opaque wallet sessions kept in the database across Render restarts.

    Only SHA-256 digests are stored; raw bearer tokens remain in the browser.
    Active sessions renew when half their lifetime has elapsed.
    """

    def __init__(self, ttl_seconds: int, database_url: str, *, create_schema: bool = False):
        self.ttl = ttl_seconds
        kwargs = {"pool_pre_ping": True}
        if database_url in {"sqlite+pysqlite://", "sqlite://"}:
            kwargs.update({"connect_args": {"check_same_thread": False}, "poolclass": StaticPool})
        elif database_url.startswith("sqlite"):
            kwargs.update({"connect_args": {"check_same_thread": False}})
        self.engine = create_engine(database_url, **kwargs)
        self.sessions = sessionmaker(self.engine, expire_on_commit=False)
        if create_schema:
            SessionBase.metadata.create_all(self.engine)

    @staticmethod
    def _hash(token: str) -> str:
        return hashlib.sha256(token.encode("utf-8")).hexdigest()

    def create(self, chain: str, wallet: str, is_guest: bool = False) -> str:
        token = secrets.token_urlsafe(32)
        now = int(time.time())
        with self.sessions.begin() as db:
            db.execute(delete(SessionModel).where(SessionModel.expires_at <= now))
            db.add(SessionModel(
                token_hash=self._hash(token),
                chain=chain,
                wallet=normalize_wallet(chain, wallet),
                is_guest=is_guest,
                expires_at=now + self.ttl,
            ))
        return token

    def get(self, token: str) -> SessionPrincipal | None:
        if not token:
            return None
        now = int(time.time())
        with self.sessions.begin() as db:
            row = db.get(SessionModel, self._hash(token))
            if row is None:
                return None
            if row.expires_at <= now:
                db.delete(row)
                return None
            if row.expires_at - now < self.ttl // 2:
                row.expires_at = now + self.ttl
            return SessionPrincipal(chain=row.chain, wallet=row.wallet, is_guest=row.is_guest)

    def save_player(self, player: object) -> None:
        data = asdict(player)
        chain = data["chain"]
        wallet = normalize_wallet(chain, data["wallet"])
        with self.sessions.begin() as db:
            row = db.get(PlayerProfileModel, (chain, wallet))
            encoded = json.dumps(data, ensure_ascii=False)
            if row is None:
                db.add(PlayerProfileModel(chain=chain, wallet=wallet, profile_json=encoded))
            else:
                row.profile_json = encoded

    def load_player(self, chain: str, wallet: str) -> dict | None:
        with self.sessions() as db:
            row = db.get(PlayerProfileModel, (chain, normalize_wallet(chain, wallet)))
            return json.loads(row.profile_json) if row is not None else None
