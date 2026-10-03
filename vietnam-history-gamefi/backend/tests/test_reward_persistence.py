from __future__ import annotations

import sqlite3

from sqlalchemy import text

from app.rewards.persistence import RewardRepository


def test_existing_reward_claims_keep_legacy_asset_during_upgrade(tmp_path):
    database = tmp_path / "legacy-rewards.db"
    with sqlite3.connect(database) as connection:
        connection.execute("CREATE TABLE reward_claims (id TEXT PRIMARY KEY)")
        connection.execute("INSERT INTO reward_claims (id) VALUES ('old-claim')")

    repository = RewardRepository(f"sqlite+pysqlite:///{database.as_posix()}")
    with repository.engine.connect() as connection:
        asset = connection.execute(text(
            "SELECT asset_symbol FROM reward_claims WHERE id = 'old-claim'"
        )).scalar_one()
    assert asset == "LEGACY"


def test_existing_retired_asset_is_normalized_without_changing_claim_id(tmp_path):
    database_url = f"sqlite+pysqlite:///{(tmp_path / 'retired.db').as_posix()}"
    repository = RewardRepository(database_url, create_schema=True)
    event = repository.record_event(
        network="devnet", wallet="wallet-one", source_type="battle",
        source_id="battle-one", qualifier="bach_dang_1288", eligible=True,
    )
    old_claim, _ = repository.reserve_claim(event=event, amount=5_000_000, asset_symbol="RETIRED")

    reopened = RewardRepository(database_url)
    claim = reopened.get_claim(old_claim.claim_id)
    assert claim.claim_id == old_claim.claim_id
    assert claim.asset_symbol == "LEGACY"


def test_reward_event_and_claim_are_durable_and_idempotent():
    repository = RewardRepository("sqlite+pysqlite://", create_schema=True)
    event = repository.record_event(
        network="devnet",
        wallet="wallet-one",
        source_type="battle",
        source_id="battle-one",
        qualifier="bach_dang_1288",
        eligible=True,
        metadata={"victory": True},
    )
    same_event = repository.record_event(
        network="devnet",
        wallet="wallet-one",
        source_type="battle",
        source_id="battle-one",
        qualifier="bach_dang_1288",
        eligible=True,
        metadata={"victory": True},
    )
    assert same_event.id == event.id
    assert repository.count_eligible_battles(
        network="devnet", wallet="wallet-one", scenario_id="bach_dang_1288"
    ) == 1

    first, created = repository.reserve_claim(event=event, amount=5_000_000)
    repeated, created_again = repository.reserve_claim(event=event, amount=5_000_000)
    assert created is True
    assert created_again is False
    assert repeated.claim_id == first.claim_id
    assert len(first.claim_id) == 64


def test_same_quest_source_is_scoped_to_each_wallet():
    repository = RewardRepository("sqlite+pysqlite://", create_schema=True)
    first_event = repository.record_event(
        network="devnet",
        wallet="wallet-one",
        source_type="quest",
        source_id="quest-one",
        qualifier="bach_dang_1288",
        eligible=True,
    )
    second_event = repository.record_event(
        network="devnet",
        wallet="wallet-two",
        source_type="quest",
        source_id="quest-one",
        qualifier="bach_dang_1288",
        eligible=True,
    )
    first_claim, _ = repository.reserve_claim(event=first_event, amount=10_000_000)
    second_claim, _ = repository.reserve_claim(event=second_event, amount=10_000_000)
    assert first_claim.claim_id != second_claim.claim_id


def test_archived_claim_is_never_repaid_as_sol():
    repository = RewardRepository("sqlite+pysqlite://", create_schema=True)
    event = repository.record_event(
        network="devnet",
        wallet="wallet-one",
        source_type="quest",
        source_id="quest-one",
        qualifier="bach_dang_1288",
        eligible=True,
    )
    archived, created = repository.reserve_claim(event=event, amount=10_000_000, asset_symbol="LEGACY")
    sol_attempt, created_again = repository.reserve_claim(event=event, amount=200_000, asset_symbol="SOL")
    assert created is True
    assert created_again is False
    assert sol_attempt.claim_id == archived.claim_id
    assert sol_attempt.asset_symbol == "LEGACY"
    assert repository.pending_wallet(network="devnet", wallet="wallet-one") == []
