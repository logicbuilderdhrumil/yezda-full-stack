-- Migration: Create integration_records table
-- Version: 011
-- Description: OAuth integration records for account settings

CREATE TABLE IF NOT EXISTS integration_records (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'candidate')),
    provider VARCHAR(50) NOT NULL,
    provider_account_id VARCHAR(255),
    provider_email VARCHAR(255),
    is_connected BOOLEAN NOT NULL DEFAULT FALSE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    scopes TEXT NOT NULL DEFAULT '',
    connected_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    last_verification_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_integration_records_tenant_user_provider UNIQUE (tenant_id, user_id, user_type, provider)
);

-- Indexes for integration lookups
CREATE INDEX IF NOT EXISTS idx_integration_records_tenant_id ON integration_records (tenant_id);
CREATE INDEX IF NOT EXISTS idx_integration_records_user_id ON integration_records (user_id);
CREATE INDEX IF NOT EXISTS idx_integration_records_provider ON integration_records (provider);
CREATE INDEX IF NOT EXISTS idx_integration_records_connected ON integration_records (is_connected) WHERE is_connected = TRUE;
