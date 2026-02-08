-- Migration 013b: Create screening pipeline tables
-- Creates base tables that migrations 015 and 016 depend on.

-- Screening pipelines (workflow templates)
CREATE TABLE IF NOT EXISTS screening_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description VARCHAR(1000),
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_screening_pipelines_tenant ON screening_pipelines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_screening_pipelines_status ON screening_pipelines(tenant_id, status);

-- Pipeline stages (individual steps within a pipeline)
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID NOT NULL REFERENCES screening_pipelines(id) ON DELETE CASCADE,
  form_definition_id UUID REFERENCES form_definitions(id),
  name VARCHAR(200) NOT NULL,
  description VARCHAR(500),
  "order" INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT TRUE,
  estimated_duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline ON pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_order ON pipeline_stages(pipeline_id, "order");

-- Pipeline assignments (linking pipelines to candidates)
CREATE TABLE IF NOT EXISTS pipeline_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  pipeline_id UUID NOT NULL REFERENCES screening_pipelines(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  current_stage_order INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
  stage_statuses JSONB NOT NULL DEFAULT '{}',
  progress_percentage NUMERIC(5,2) NOT NULL DEFAULT 0,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_assignments_tenant ON pipeline_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_assignments_pipeline ON pipeline_assignments(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_assignments_candidate ON pipeline_assignments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_assignments_status ON pipeline_assignments(status);
