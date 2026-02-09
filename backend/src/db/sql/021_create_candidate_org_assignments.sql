-- Migration: Create candidate_org_assignments table
-- Version: 021
-- Description: Links global candidates to local candidates in specific organizations

CREATE TABLE IF NOT EXISTS candidate_org_assignments (
    id UUID PRIMARY KEY,
    global_candidate_id UUID NOT NULL REFERENCES global_candidates(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    local_candidate_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    added_by UUID NOT NULL,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Unique constraint: one assignment per global candidate per tenant
    CONSTRAINT uq_candidate_org_assignment UNIQUE (global_candidate_id, tenant_id)
);

-- Index for global candidate lookups
CREATE INDEX IF NOT EXISTS idx_candidate_org_assignments_global_id ON candidate_org_assignments (global_candidate_id);

-- Index for tenant lookups
CREATE INDEX IF NOT EXISTS idx_candidate_org_assignments_tenant ON candidate_org_assignments (tenant_id);

-- Index for local candidate lookups
CREATE INDEX IF NOT EXISTS idx_candidate_org_assignments_local ON candidate_org_assignments (tenant_id, local_candidate_id);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_candidate_org_assignments_status ON candidate_org_assignments (global_candidate_id, status);

-- Trigger to update updated_at on modification
CREATE OR REPLACE FUNCTION update_candidate_org_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_candidate_org_assignments_updated_at ON candidate_org_assignments;
CREATE TRIGGER trigger_update_candidate_org_assignments_updated_at
    BEFORE UPDATE ON candidate_org_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_candidate_org_assignments_updated_at();
