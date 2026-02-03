-- Migration: Create sessions table
-- Version: 002
-- Description: Session management for token tracking and revocation

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'candidate')),
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    rotated_from_id UUID REFERENCES sessions(id)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_refresh_token ON sessions (refresh_token_hash);
