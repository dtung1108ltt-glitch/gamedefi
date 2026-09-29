from __future__ import annotations

from app.blockchain.interface import BlockchainAdapter, NftInfo, PreparedRewardSubmission, TransactionInfo
from app.blockchain.solana_adapter import MEMO_PROGRAM_ID
from solders.system_program import ID as SYSTEM_PROGRAM_ID
import base58


class FakeAdapter(BlockchainAdapter):
    def __init__(self, chain: str = "solana") -> None:
        self._chain = chain
        self.txs: dict[str, TransactionInfo] = {}
        self.ownership: dict[str, str] = {}
        self.nfts: dict[str, list[NftInfo]] = {}
        self._seq = 0
        self.prepared_rewards: dict[str, tuple[str, int, str]] = {}

    def _norm(self, wallet: str) -> str:
        return wallet

    def chain_name(self) -> str:
        return self._chain

    def mint_faction(self, recipient: str, faction_id: int) -> tuple[str, str]:
        self._seq += 1
        digest = f"{self._chain}-fakedigest{self._seq}"
        object_id = f"{self._chain}-fakenft{self._seq}"
        norm = self._norm(recipient)
        self.ownership[object_id] = norm
        self.nfts.setdefault(norm, []).append(
            NftInfo(object_id, norm, faction_id, f"Faction {faction_id}", "rare", "img.png")
        )
        self.txs[digest] = TransactionInfo(
            digest=digest,
            status="success",
            sender=recipient,
            timestamp_ms=1_700_000_000_000,
            events=[{"eventType": "FactionMinted", "faction_id": faction_id, "object_id": object_id}],
        )
        return digest, object_id

    def prepare_sol_reward(
        self, recipient: str, amount: int, claim_id: bytes
    ) -> PreparedRewardSubmission:
        self._seq += 1
        signature = f"{self._chain}-reward{self._seq}"
        self.prepared_rewards[signature] = (recipient, amount, claim_id.hex())
        return PreparedRewardSubmission(
            signature=signature,
            receipt_address=None,
            signed_transaction=f"signed-{signature}",
            last_valid_block_height=999_999_999,
        )

    def submit_reward(self, prepared: PreparedRewardSubmission) -> str:
        recipient, amount, claim_hex = self.prepared_rewards[prepared.signature]
        self.txs[prepared.signature] = TransactionInfo(
            digest=prepared.signature,
            status="success",
            sender="6RigAPgKTdEwxmRqaoMiJj6GYnkipTSwRRc9Wkw79rTv",
            timestamp_ms=1_700_000_000_001,
            events=[{"recipient": recipient, "amount": amount, "claim_id": claim_hex}],
            raw={"transaction": {"message": {
                "accountKeys": ["6RigAPgKTdEwxmRqaoMiJj6GYnkipTSwRRc9Wkw79rTv", recipient,
                                str(SYSTEM_PROGRAM_ID), MEMO_PROGRAM_ID],
                "instructions": [
                    {"programIdIndex": 2, "accounts": [0, 1],
                     "data": base58.b58encode((2).to_bytes(4, "little") + amount.to_bytes(8, "little")).decode()},
                    {"programIdIndex": 3, "accounts": [],
                     "data": base58.b58encode(b"gamefi-sol-reward:" + claim_hex.encode()).decode()},
                ],
            }}},
        )
        return prepared.signature

    def get_transaction(self, digest: str) -> TransactionInfo | None:
        return self.txs.get(digest)


    def verify_ownership(self, wallet: str, object_id: str) -> bool:
        return self.ownership.get(object_id) == self._norm(wallet)

    def verify_faction_mint(self, wallet: str, object_id: str, faction_id: int, digest: str) -> bool:
        tx = self.get_transaction(digest)
        return bool(
            tx
            and tx.succeeded
            and tx.sender == wallet
            and any(
                event.get("eventType") == "FactionMinted"
                and event.get("faction_id") == faction_id
                and event.get("object_id") == object_id
                for event in tx.events
            )
        )

    def get_faction_nfts(self, wallet: str) -> list[NftInfo]:
        return self.nfts.get(self._norm(wallet), [])
