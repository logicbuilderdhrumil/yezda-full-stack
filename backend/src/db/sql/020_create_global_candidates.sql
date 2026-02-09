-- Migration: Create global_candidates table
-- Version: 020
-- Description: Global candidate identity for cross-tenant candidate linking

CREATE TABLE IF NOT EXISTS global_candidates (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    normalized_email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    phone_number VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email lookups (normalized email is the primary lookup key)
CREATE INDEX IF NOT EXISTS idx_global_candidates_normalized_email ON global_candidates (normalized_email);

-- Index for name searches
CREATE INDEX IF NOT EXISTS idx_global_candidates_name ON global_candidates (LOWER(first_name), LOWER(last_name));

-- Full-text search index for name
CREATE INDEX IF NOT EXISTS idx_global_candidates_search ON global_candidates USING gin (
    to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(email, ''))
);

-- Trigger to update updated_at on modification
CREATE OR REPLACE FUNCTION update_global_candidates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_global_candidates_updated_at ON global_candidates;
CREATE TRIGGER trigger_update_global_candidates_updated_at
    BEFORE UPDATE ON global_candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_global_candidates_updated_at();
