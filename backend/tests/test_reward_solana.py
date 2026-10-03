import base64
import json

import httpx
from solders.hash import Hash
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.transaction import Transaction
from solders.system_program import ID as SYSTEM_PROGRAM_ID

from app.blockchain.solana_adapter import MEMO_PROGRAM_ID, SolanaAdapter, SolanaAdapterError
from app.core.config import Settings


PROGRAM_ID = "8qUBTgX99v5EhxbAaxuqS94rgfRhnLrTgW66Gh9BvLKN"
RECIPIENT = "HUQHQv86C6sqqEWMpq8VcUs6kmQo78EsDV9cgEC9GaLK"


def test_prepares_native_sol_reward_with_exact_recipient_amount_and_claim():
    signer = Keypair()
    def handler(request):
        body = json.loads(request.content)
        if body["method"] == "getBalance":
            return httpx.Response(200, json={"result": {"value": 1_000_000_000}})
        if body["method"] == "getLatestBlockhash":
            return httpx.Response(200, json={"result": {"value": {
                "blockhash": str(Hash.new_unique()), "lastValidBlockHeight": 999,
            }}})
        raise AssertionError(body["method"])
    settings = Settings(
        sol_reward_signer_address=str(signer.pubkey()),
        sol_reward_signer_keypair_base64=base64.b64encode(bytes(signer)).decode(),
    )
    adapter = SolanaAdapter(settings, httpx.Client(transport=httpx.MockTransport(handler)))
    claim_id = bytes(range(32))
    prepared = adapter.prepare_sol_reward(RECIPIENT, 100_000, claim_id)
    transaction = Transaction.from_bytes(base64.b64decode(prepared.signed_transaction))
    assert transaction.verify_with_results() == [True]
    assert prepared.receipt_address is None
    keys = transaction.message.account_keys
    payment, memo = transaction.message.instructions
    assert keys[payment.program_id_index] == SYSTEM_PROGRAM_ID
    assert keys[payment.accounts[0]] == signer.pubkey()
    assert keys[payment.accounts[1]] == Pubkey.from_string(RECIPIENT)
    assert bytes(payment.data) == (2).to_bytes(4, "little") + (100_000).to_bytes(8, "little")
    assert keys[memo.program_id_index] == Pubkey.from_string(MEMO_PROGRAM_ID)
    assert bytes(memo.data) == b"gamefi-sol-reward:" + claim_id.hex().encode()

    adapter.s = settings.model_copy(update={"solana_network": "mainnet-beta"})
    try:
        adapter.prepare_sol_reward(RECIPIENT, 100_000, claim_id)
    except SolanaAdapterError as exc:
        assert "Devnet" in str(exc)
    else:
        raise AssertionError("Mainnet reward must be blocked")
