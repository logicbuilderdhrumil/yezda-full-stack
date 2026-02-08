-- Migration 013a: Create form_definitions table
-- Required by pipeline_stages (form_definition_id FK) and app-application-intake

CREATE TABLE IF NOT EXISTS form_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  schema JSONB NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_form_definitions_tenant ON form_definitions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_form_definitions_status ON form_definitions(tenant_id, status);
