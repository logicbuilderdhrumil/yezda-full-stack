-- Migration 016: Add review_tasks table
-- Supports the human_review pipeline module type.

CREATE TABLE IF NOT EXISTS review_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL,
  pipeline_id UUID NOT NULL,
  assignment_id UUID NOT NULL,
  stage_id UUID NOT NULL,
  candidate_id UUID NOT NULL,
  assignee_id UUID,
  assignee_role VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  decision VARCHAR(50),
  decision_notes TEXT,
  review_form_id UUID,
  review_form_data JSONB,
  decision_options JSONB NOT NULL DEFAULT '[]',
  timeout_hours INTEGER NOT NULL DEFAULT 24,
  escalation_policy JSONB NOT NULL DEFAULT '{}',
  due_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  decided_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tenant scoping
CREATE INDEX idx_review_tasks_tenant ON review_tasks(tenant_id);

-- Look-ups by assignment (which pipeline run)
CREATE INDEX idx_review_tasks_assignment ON review_tasks(assignment_id);

-- Filter by status
CREATE INDEX idx_review_tasks_status ON review_tasks(status);

-- Queue look-ups by assignee
CREATE INDEX idx_review_tasks_assignee ON review_tasks(assignee_id);

-- Expiration check: only open tasks
CREATE INDEX idx_review_tasks_due ON review_tasks(due_at)
  WHERE status IN ('pending', 'assigned', 'in_review');
