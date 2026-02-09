-- Migration: Add cross-org consent fields to consent_decisions table
-- Version: 023
-- Description: Support cross-tenant consent with source/target organization IDs

-- First, create consent_decisions table if it doesn't exist
CREATE TABLE IF NOT EXISTS consent_decisions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    candidate_id UUID NOT NULL,
    screening_id UUID,
    scopes TEXT[] NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'granted' CHECK (status IN ('granted', 'withdrawn', 'expired')),
    version INTEGER NOT NULL DEFAULT 1,
    consented_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    ip_address VARCHAR(45),
    user_agent TEXT,
    source_org_id UUID,
    target_org_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add cross-org fields if the table already exists
DO $$
BEGIN
  -- source_org_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'consent_decisions' 
                 AND column_name = 'source_org_id') THEN
    ALTER TABLE consent_decisions ADD COLUMN source_org_id UUID;
  END IF;

  -- target_org_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'consent_decisions' 
                 AND column_name = 'target_org_id') THEN
    ALTER TABLE consent_decisions ADD COLUMN target_org_id UUID;
  END IF;
END $$;

-- Indexes for consent lookups
CREATE INDEX IF NOT EXISTS idx_consent_decisions_tenant ON consent_decisions (tenant_id);
CREATE INDEX IF NOT EXISTS idx_consent_decisions_candidate ON consent_decisions (tenant_id, candidate_id);
CREATE INDEX IF NOT EXISTS idx_consent_decisions_status ON consent_decisions (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_consent_decisions_screening ON consent_decisions (screening_id);

-- Cross-org consent indexes
CREATE INDEX IF NOT EXISTS idx_consent_decisions_source_org ON consent_decisions (source_org_id) WHERE source_org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consent_decisions_target_org ON consent_decisions (target_org_id) WHERE target_org_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_consent_decisions_cross_org ON consent_decisions (source_org_id, target_org_id) 
    WHERE source_org_id IS NOT NULL AND target_org_id IS NOT NULL;

-- Trigger to update updated_at on modification
CREATE OR REPLACE FUNCTION update_consent_decisions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_consent_decisions_updated_at ON consent_decisions;
CREATE TRIGGER trigger_update_consent_decisions_updated_at
    BEFORE UPDATE ON consent_decisions
    FOR EACH ROW
    EXECUTE FUNCTION update_consent_decisions_updated_at();
