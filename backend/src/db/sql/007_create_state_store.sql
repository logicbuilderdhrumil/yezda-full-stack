-- Migration: Create state_store table
-- Version: 007
-- Description: Persisted state for preferences and session data with tenant scoping

CREATE TABLE IF NOT EXISTS state_store (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'candidate')),
    key VARCHAR(255) NOT NULL,
    value TEXT NOT NULL, -- Encrypted JSON string
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: one entry per tenant/user/key combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_state_store_tenant_user_key 
ON state_store (tenant_id, user_id, user_type, key);

-- Index for efficient user state lookups
CREATE INDEX IF NOT EXISTS idx_state_store_user_lookup
ON state_store (user_id, user_type);

-- Index for tenant-scoped queries
CREATE INDEX IF NOT EXISTS idx_state_store_tenant_lookup
ON state_store (tenant_id);

-- Index for cleanup of expired entries
CREATE INDEX IF NOT EXISTS idx_state_store_expires_at
ON state_store (expires_at) WHERE expires_at IS NOT NULL;

-- Comment for documentation
COMMENT ON TABLE state_store IS 'Encrypted key-value state storage with tenant isolation';
COMMENT ON COLUMN state_store.value IS 'AES-256-GCM encrypted JSON value';
COMMENT ON COLUMN state_store.tenant_id IS 'Required for tenant data isolation';
