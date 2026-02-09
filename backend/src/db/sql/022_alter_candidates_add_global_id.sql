-- Migration: Alter candidates table to add global_candidate_id
-- Version: 022
-- Description: Links local candidates to their global identity

DO $$
BEGIN
  -- Add global_candidate_id column if not exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'candidates' 
                 AND column_name = 'global_candidate_id') THEN
    ALTER TABLE candidates ADD COLUMN global_candidate_id UUID;
  END IF;
END $$;

-- Create index for global candidate lookups
CREATE INDEX IF NOT EXISTS idx_candidates_global_candidate_id ON candidates (global_candidate_id);

-- Add foreign key constraint (conditional - requires global_candidates table to exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_candidates_global_candidate') THEN
    ALTER TABLE candidates 
      ADD CONSTRAINT fk_candidates_global_candidate 
      FOREIGN KEY (global_candidate_id) 
      REFERENCES global_candidates(id) 
      ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- global_candidates table doesn't exist yet, skip FK
    RAISE NOTICE 'global_candidates table not found, skipping FK constraint';
END $$;
