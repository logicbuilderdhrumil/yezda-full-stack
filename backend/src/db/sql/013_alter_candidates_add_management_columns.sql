-- Migration: 013_alter_candidates_add_management_columns.sql
-- Adds candidate management columns to the existing candidates table
-- Supports tenant isolation, profile data, status tracking, and audit fields
-- NOTE: The original candidates table (001) was auth-only; this migration
-- extends it for the candidate-management feature.

-- Add management columns (skip if already present via IF NOT EXISTS on constraints)
DO $$
BEGIN
  -- tenant_id
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'tenant_id') THEN
    ALTER TABLE candidates ADD COLUMN tenant_id VARCHAR(255);
  END IF;

  -- first_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'first_name') THEN
    ALTER TABLE candidates ADD COLUMN first_name VARCHAR(255) NOT NULL DEFAULT '';
  END IF;

  -- last_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'last_name') THEN
    ALTER TABLE candidates ADD COLUMN last_name VARCHAR(255) NOT NULL DEFAULT '';
  END IF;

  -- phone
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'phone') THEN
    ALTER TABLE candidates ADD COLUMN phone VARCHAR(50);
  END IF;

  -- status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'status') THEN
    ALTER TABLE candidates ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending';
  END IF;

  -- application_date
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'application_date') THEN
    ALTER TABLE candidates ADD COLUMN application_date TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;

  -- certified_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'certified_at') THEN
    ALTER TABLE candidates ADD COLUMN certified_at TIMESTAMPTZ;
  END IF;

  -- certified_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'certified_by') THEN
    ALTER TABLE candidates ADD COLUMN certified_by VARCHAR(255);
  END IF;

  -- archived_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'archived_at') THEN
    ALTER TABLE candidates ADD COLUMN archived_at TIMESTAMPTZ;
  END IF;

  -- archived_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'archived_by') THEN
    ALTER TABLE candidates ADD COLUMN archived_by VARCHAR(255);
  END IF;

  -- metadata (JSONB)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'metadata') THEN
    ALTER TABLE candidates ADD COLUMN metadata JSONB;
  END IF;

  -- created_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'created_by') THEN
    ALTER TABLE candidates ADD COLUMN created_by VARCHAR(255);
  END IF;

  -- updated_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'updated_by') THEN
    ALTER TABLE candidates ADD COLUMN updated_by VARCHAR(255);
  END IF;

  -- password_hash: make nullable (management-created candidates may not have passwords)
  ALTER TABLE candidates ALTER COLUMN password_hash DROP NOT NULL;
  ALTER TABLE candidates ALTER COLUMN password_hash SET DEFAULT NULL;

  -- email: drop unique constraint to allow per-tenant uniqueness instead
  -- (the unique constraint from 001 doesn't account for multi-tenancy)
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'candidates_email_key') THEN
    ALTER TABLE candidates DROP CONSTRAINT candidates_email_key;
  END IF;
END $$;

-- Add indexes for management queries
CREATE INDEX IF NOT EXISTS idx_candidates_tenant_id ON candidates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_candidates_tenant_email ON candidates(tenant_id, LOWER(email));
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(tenant_id, created_at);
