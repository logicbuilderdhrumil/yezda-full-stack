-- Migration: Create managed_users table
-- Version: 010
-- Description: Multi-tenant user management with RBAC support

-- Managed users table (organization members)
CREATE TABLE IF NOT EXISTS managed_users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    display_name VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    roles TEXT[] NOT NULL DEFAULT '{}',
    tenant_id UUID NOT NULL,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    UNIQUE (email, tenant_id)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_managed_users_tenant_id ON managed_users (tenant_id);
CREATE INDEX IF NOT EXISTS idx_managed_users_email_tenant ON managed_users (LOWER(email), tenant_id);
CREATE INDEX IF NOT EXISTS idx_managed_users_status ON managed_users (status) WHERE status != 'inactive';
CREATE INDEX IF NOT EXISTS idx_managed_users_roles ON managed_users USING GIN (roles);
CREATE INDEX IF NOT EXISTS idx_managed_users_created_at ON managed_users (created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_managed_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_managed_users_updated_at ON managed_users;
CREATE TRIGGER trigger_managed_users_updated_at
    BEFORE UPDATE ON managed_users
    FOR EACH ROW
    EXECUTE FUNCTION update_managed_users_updated_at();

-- Comment on table and columns
COMMENT ON TABLE managed_users IS 'Multi-tenant user management for organization members';
COMMENT ON COLUMN managed_users.tenant_id IS 'Organization/tenant identifier for data isolation';
COMMENT ON COLUMN managed_users.roles IS 'Array of roles: admin, manager, agent, viewer';
COMMENT ON COLUMN managed_users.status IS 'Account status: active, inactive, suspended, pending';
