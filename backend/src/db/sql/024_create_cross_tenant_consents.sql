-- Migration: Create cross_tenant_consents table
-- Version: 024
-- Description: Cross-tenant consent records for data sharing between organizations

CREATE TABLE IF NOT EXISTS cross_tenant_consents (
    id UUID PRIMARY KEY,
    global_candidate_id UUID NOT NULL REFERENCES global_candidates(id) ON DELETE CASCADE,
    source_org_id UUID NOT NULL,
    target_org_id UUID NOT NULL,
    consent_type VARCHAR(30) NOT NULL CHECK (consent_type IN ('screening_data', 'documents', 'full_profile')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'denied', 'revoked', 'expired')),
    granted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    candidate_signature TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Unique constraint: one consent per candidate + source + target + type pair
    -- (allows re-requesting after denial, but not duplicate pending/granted)
    CONSTRAINT chk_cross_tenant_different_orgs CHECK (source_org_id != target_org_id)
);

-- Index for candidate lookups
CREATE INDEX IF NOT EXISTS idx_cross_tenant_consents_global_id ON cross_tenant_consents (global_candidate_id);

-- Index for source org lookups
CREATE INDEX IF NOT EXISTS idx_cross_tenant_consents_source ON cross_tenant_consents (source_org_id);

-- Index for target org lookups
CREATE INDEX IF NOT EXISTS idx_cross_tenant_consents_target ON cross_tenant_consents (target_org_id);

-- Composite index for consent pair lookups
CREATE INDEX IF NOT EXISTS idx_cross_tenant_consents_pair ON cross_tenant_consents (
    global_candidate_id, source_org_id, target_org_id, consent_type
);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_cross_tenant_consents_status ON cross_tenant_consents (global_candidate_id, status);

-- Index for expiring consents (for cleanup jobs)
CREATE INDEX IF NOT EXISTS idx_cross_tenant_consents_expires ON cross_tenant_consents (expires_at) 
    WHERE status = 'granted' AND expires_at IS NOT NULL;

-- Trigger to update updated_at on modification
CREATE OR REPLACE FUNCTION update_cross_tenant_consents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cross_tenant_consents_updated_at ON cross_tenant_consents;
CREATE TRIGGER trigger_update_cross_tenant_consents_updated_at
    BEFORE UPDATE ON cross_tenant_consents
    FOR EACH ROW
    EXECUTE FUNCTION update_cross_tenant_consents_updated_at();
