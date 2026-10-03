-- Preserve old claim ids for idempotency without exposing a retired asset.
UPDATE reward_claims SET asset_symbol = 'LEGACY' WHERE asset_symbol NOT IN ('SOL', 'LEGACY');
ALTER TABLE reward_claims ALTER COLUMN asset_symbol SET DEFAULT 'SOL';
