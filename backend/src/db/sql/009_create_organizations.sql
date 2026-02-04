-- Migration: Create organizations table
-- Version: 009
-- Description: Organization management - multi-tenant organization entities

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'suspended', 'pending', 'archived')),
    plan VARCHAR(20) NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
    logo_url TEXT,
    website TEXT,
    primary_contact_email VARCHAR(255) NOT NULL,
    primary_contact_name VARCHAR(100),
    metadata JSONB,
    settings JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_by UUID
);

-- Indexes for organization queries
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations (slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations (status);
CREATE INDEX IF NOT EXISTS idx_organizations_plan ON organizations (plan);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON organizations (created_at DESC);

-- Composite index for listing with filters
CREATE INDEX IF NOT EXISTS idx_organizations_status_plan ON organizations (status, plan);

-- Full-text search index for name and description
CREATE INDEX IF NOT EXISTS idx_organizations_search ON organizations USING gin (
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
);
