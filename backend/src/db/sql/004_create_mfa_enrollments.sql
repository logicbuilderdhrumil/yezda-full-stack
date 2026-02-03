-- Migration: Create MFA enrollments table
-- Version: 004
-- Description: TOTP enrollment tracking

CREATE TABLE IF NOT EXISTS mfa_enrollments (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'candidate')),
    secret VARCHAR(255) NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

-- Index for pending enrollment lookup
CREATE INDEX IF NOT EXISTS idx_mfa_enrollments_user ON mfa_enrollments (user_id, user_type);
CREATE INDEX IF NOT EXISTS idx_mfa_enrollments_pending ON mfa_enrollments (user_id, user_type) WHERE verified = FALSE;
