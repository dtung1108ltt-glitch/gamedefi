from fastapi import APIRouter, Depends, Header, HTTPException, Request

from app.api.dependencies import require_session
from app.core.security import LOGIN_MESSAGE_TEMPLATE, NonceStore, SessionPrincipal, SessionStore, verify_wallet_signature
from app.core.store import store
from app.schemas import (
    GuestLoginRequest,
    NonceRequest,
    NonceResponse,
    AuthenticatedPlayerOut,
    PlayerOut,
    WalletVerifyRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])


def get_nonce_store(request: Request) -> NonceStore:
    return request.app.state.nonce_store


def get_session_store(request: Request) -> SessionStore:
    return request.app.state.session_store


def _authenticated_player(player, access_token: str) -> AuthenticatedPlayerOut:
    return AuthenticatedPlayerOut(
        wallet=player.wallet,
        chain=player.chain,
        username=player.username,
        faction_id=player.faction_id,
        nft_object_id=player.nft_object_id,
        level=player.level,
        rice=player.rice,
        gold=player.gold,
        morale=player.morale,
        is_guest=player.is_guest,
        access_token=access_token,
    )


@router.post("/nonce", response_model=NonceResponse)
def create_nonce(body: NonceRequest, nonces: NonceStore = Depends(get_nonce_store)):
    nonce, message = nonces.create(body.chain, body.wallet)
    return NonceResponse(nonce=nonce, message=message)


@router.post("/wallet", response_model=AuthenticatedPlayerOut)
def verify_wallet(
    body: WalletVerifyRequest,
    nonces: NonceStore = Depends(get_nonce_store),
    sessions: SessionStore = Depends(get_session_store),
):
    if body.message != LOGIN_MESSAGE_TEMPLATE.format(nonce=body.nonce):
        raise HTTPException(status_code=400, detail="Message không khớp wallet challenge")
    if not nonces.is_valid(body.chain, body.wallet, body.nonce):
        raise HTTPException(status_code=400, detail="Nonce không hợp lệ hoặc hết hạn")
    if not verify_wallet_signature(body.chain, body.wallet, body.message.encode("utf-8"), body.signature):
        raise HTTPException(status_code=401, detail="Chữ ký ví không hợp lệ")
    # Consume only after signature verification. A bad signature must not be
    # able to burn a legitimate challenge issued to this wallet.
    if not nonces.consume(body.chain, body.wallet, body.nonce):
        raise HTTPException(status_code=400, detail="Nonce đã được sử dụng")
    if store.get_player(body.chain, body.wallet) is None:
        profile = sessions.load_player(body.chain, body.wallet)
        if profile is not None:
            store.restore_player(profile)
    player = store.get_or_create_player(body.chain, body.wallet)
    sessions.save_player(player)
    return _authenticated_player(player, sessions.create(player.chain, player.wallet))


@router.post("/guest", response_model=AuthenticatedPlayerOut)
def guest_login(body: GuestLoginRequest | None = None, sessions: SessionStore = Depends(get_session_store)):
    """Đăng nhập trải nghiệm Free-to-Play không cần kết nối ví (Section 13 & 14)."""
    uname = body.username if body else None
    player = store.create_guest_player(uname)
    sessions.save_player(player)
    return _authenticated_player(player, sessions.create(player.chain, player.wallet, is_guest=True))


@router.get("/session")
def current_session(
    request: Request,
    authorization: str | None = Header(default=None),
):
    """Check current session. Returns 200 with authenticated status — never 401.

    If the session is valid: { "authenticated": true, "user": { ...player data... } }
    If not authenticated:    { "authenticated": false, "user": null }
    """
    # No token → not authenticated (not an error)
    if not authorization or not authorization.startswith("Bearer "):
        return {"authenticated": False, "user": None}

    token = authorization.removeprefix("Bearer ").strip()
    session_store = request.app.state.session_store
    principal = session_store.get(token)

    if principal is None:
        return {"authenticated": False, "user": None}

    # Try to find/restore the player
    player = store.get_player(principal.chain, principal.wallet)
    if player is None:
        profile = session_store.load_player(principal.chain, principal.wallet)
        if profile is None:
            return {"authenticated": False, "user": None}
        store.restore_player(profile)
        player = store.get_player(principal.chain, principal.wallet)

    if player is None:
        return {"authenticated": False, "user": None}

    res = PlayerOut.model_validate(player, from_attributes=True).model_dump()
    res["authenticated"] = True
    res["user"] = res.copy()
    return res
