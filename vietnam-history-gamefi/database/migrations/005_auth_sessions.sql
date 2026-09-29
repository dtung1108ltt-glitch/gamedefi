-- Persist opaque wallet sessions and the player fields needed after an app restart.
-- Only token hashes are kept server-side.
CREATE TABLE IF NOT EXISTS auth_sessions (
    token_hash VARCHAR(64) PRIMARY KEY,
    chain VARCHAR(16) NOT NULL,
    wallet VARCHAR(128) NOT NULL,
    is_guest BOOLEAN NOT NULL,
    expires_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_auth_sessions_wallet ON auth_sessions (wallet);
CREATE INDEX IF NOT EXISTS ix_auth_sessions_expires_at ON auth_sessions (expires_at);

CREATE TABLE IF NOT EXISTS player_profiles (
    chain VARCHAR(16) NOT NULL,
    wallet VARCHAR(128) NOT NULL,
    profile_json TEXT NOT NULL,
    PRIMARY KEY (chain, wallet)
);
