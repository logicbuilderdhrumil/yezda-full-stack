-- Migration: Create backup_codes table
-- Version: 006
-- Description: MFA backup codes for account recovery

CREATE TABLE IF NOT EXISTS backup_codes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'candidate')),
    code_hash VARCHAR(64) NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for lookup by user
CREATE INDEX IF NOT EXISTS idx_backup_codes_user ON backup_codes (user_id, user_type);
-- Index for unused codes lookup
CREATE INDEX IF NOT EXISTS idx_backup_codes_unused ON backup_codes (user_id, user_type) WHERE used_at IS NULL;
