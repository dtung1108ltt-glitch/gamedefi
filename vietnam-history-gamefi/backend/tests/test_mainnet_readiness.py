import base64

from solders.keypair import Keypair

from app.core.config import Settings
from app.core.readiness import (
    UPGRADEABLE_LOADER,
    _program_authority,
)


class RpcAccounts:
    def __init__(self, accounts):
        self.accounts = accounts

    def _rpc(self, method, params):
        assert method == "getAccountInfo"
        return {"value": self.accounts.get(params[0])}


def account(owner, data, *, executable=False):
    return {"owner": owner, "executable": executable, "data": [base64.b64encode(data).decode(), "base64"]}


def test_program_upgrade_authority_is_read_from_programdata():
    program = Keypair().pubkey()
    programdata = Keypair().pubkey()
    authority = Keypair().pubkey()
    accounts = {
        str(program): account(UPGRADEABLE_LOADER, (2).to_bytes(4, "little") + bytes(programdata), executable=True),
        str(programdata): account(
            UPGRADEABLE_LOADER,
            (3).to_bytes(4, "little") + (123).to_bytes(8, "little") + b"\x01" + bytes(authority),
        ),
    }
    assert _program_authority(RpcAccounts(accounts), str(program)) == str(authority)
    accounts[str(programdata)] = account(
        UPGRADEABLE_LOADER, (3).to_bytes(4, "little") + (123).to_bytes(8, "little") + b"\x00" + bytes(32),
    )
    try:
        _program_authority(RpcAccounts(accounts), str(program))
    except ValueError as exc:
        assert "không có upgrade authority" in str(exc)
    else:
        raise AssertionError("an immutable program must not pass the expected authority check")
