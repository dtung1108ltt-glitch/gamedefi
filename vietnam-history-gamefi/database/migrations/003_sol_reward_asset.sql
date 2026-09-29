-- Preserve historical HKDV claims while new rewards use native SOL.
-- Apply once after 002_reward_claims.sql. Existing rows receive HKDV;
-- new rows explicitly set SOL in the application.
ALTER TABLE reward_claims
  ADD COLUMN IF NOT EXISTS asset_symbol VARCHAR(8) NOT NULL DEFAULT 'HKDV';
