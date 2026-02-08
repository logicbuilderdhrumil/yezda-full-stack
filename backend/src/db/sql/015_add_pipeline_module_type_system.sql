-- Migration: Add module type system to pipeline stages
-- Non-breaking: adds columns with defaults, backfills existing data.

-- 1. Create the module_type enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'pipeline_module_type') THEN
    CREATE TYPE pipeline_module_type AS ENUM (
      'form',
      'external_service',
      'internal_processing',
      'human_review',
      'notification'
    );
  END IF;
END
$$;

-- 2. Add module_type column to pipeline_stages (default: 'form')
ALTER TABLE pipeline_stages
  ADD COLUMN IF NOT EXISTS module_type pipeline_module_type NOT NULL DEFAULT 'form';

-- 3. Add module_config JSONB column to pipeline_stages (default: empty object)
ALTER TABLE pipeline_stages
  ADD COLUMN IF NOT EXISTS module_config JSONB NOT NULL DEFAULT '{}'::jsonb;

-- 4. Add graph JSONB column to screening_pipelines (nullable — only set from builder)
ALTER TABLE screening_pipelines
  ADD COLUMN IF NOT EXISTS graph JSONB;

-- 5. Backfill existing form-only stages:
--    Set module_type = 'form' and build moduleConfig from form_definition_id
UPDATE pipeline_stages
SET module_type  = 'form',
    module_config = jsonb_build_object('formDefinitionId', form_definition_id)
WHERE module_type = 'form'
  AND (module_config IS NULL OR module_config = '{}'::jsonb);

-- 6. Index on module_type for filtering
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_module_type
  ON pipeline_stages (module_type);

-- 7. GIN index on module_config for JSONB queries
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_module_config
  ON pipeline_stages USING GIN (module_config);
