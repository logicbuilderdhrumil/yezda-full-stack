-- Migration: Create password reset tokens table
-- Version: 003
-- Description: Secure password reset token storage

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'candidate')),
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_password_reset_token_hash ON password_reset_tokens (token_hash);

-- Index for cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens (expires_at);
