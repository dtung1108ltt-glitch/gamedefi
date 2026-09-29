from __future__ import annotations

from dataclasses import dataclass
import base58
from solders.system_program import ID as SYSTEM_PROGRAM_ID

from app.blockchain.interface import BlockchainAdapter
from app.blockchain.solana_adapter import MEMO_PROGRAM_ID
from app.rewards.persistence import RewardClaimRecord, RewardRepository


@dataclass(frozen=True)
class RewardReconciliationResult:
    checked: int = 0
    confirmed: int = 0
    failed: int = 0
    pending: int = 0


def _matches_sol_payment(raw: dict, *, distributor: str, claim: RewardClaimRecord) -> bool:
    message = (raw.get("transaction") or {}).get("message") or {}
    account_keys = [key.get("pubkey") if isinstance(key, dict) else key
                    for key in message.get("accountKeys", [])]
    if not account_keys or account_keys[0] != distributor:
        return False
    paid = memoed = False
    for instruction in message.get("instructions", []):
        try:
            program = account_keys[instruction["programIdIndex"]]
            data = base58.b58decode(instruction["data"])
            accounts = [account_keys[index] for index in instruction.get("accounts", [])]
        except (KeyError, IndexError, TypeError, ValueError):
            return False
        if program == str(SYSTEM_PROGRAM_ID) and len(data) == 12 and data[:4] == (2).to_bytes(4, "little"):
            paid = accounts == [distributor, claim.wallet] and int.from_bytes(data[4:], "little") == claim.amount
        if program == MEMO_PROGRAM_ID:
            memoed = data == b"gamefi-sol-reward:" + claim.claim_id.encode("ascii")
    return paid and memoed


def reconcile_claim(
    repository: RewardRepository,
    adapter: BlockchainAdapter,
    claim: RewardClaimRecord,
    distributor: str,
) -> str:
    if claim.asset_symbol != "SOL":
        return "archived"
    if not claim.tx_signature:
        repository.mark_failed(claim.claim_id, "Claim chưa có chữ ký Solana")
        return "failed"
    transaction = adapter.get_transaction(claim.tx_signature)
    if transaction is None or transaction.status == "pending":
        return "pending"
    if transaction.status == "failure":
        repository.mark_reconciled(claim.claim_id, "failed", "Giao dịch reward thất bại on-chain")
        return "failed"
    verified = transaction.sender == distributor and _matches_sol_payment(
        transaction.raw, distributor=distributor, claim=claim,
    )
    if verified:
        repository.mark_reconciled(claim.claim_id, "confirmed")
        return "confirmed"
    repository.mark_submission_uncertain(
        claim.claim_id,
        "Giao dịch thành công nhưng nội dung chuyển thưởng chưa khớp",
    )
    return "pending"


def reconcile_wallet(
    repository: RewardRepository,
    adapter: BlockchainAdapter,
    *,
    network: str,
    wallet: str,
    distributor: str,
) -> RewardReconciliationResult:
    checked = confirmed = failed = pending = 0
    for claim in repository.pending_wallet(network=network, wallet=wallet):
        checked += 1
        status = reconcile_claim(repository, adapter, claim, distributor)
        if status == "confirmed":
            confirmed += 1
        elif status == "failed":
            failed += 1
        else:
            pending += 1
    return RewardReconciliationResult(checked, confirmed, failed, pending)
