-- Migration: Create user_profiles table
-- Version: 010
-- Description: User profile storage for account settings

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'candidate')),
    display_name VARCHAR(255),
    avatar_url TEXT,
    phone VARCHAR(50),
    timezone VARCHAR(100),
    locale VARCHAR(20),
    bio TEXT,
    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_profiles_tenant_user UNIQUE (tenant_id, user_id, user_type)
);

-- Indexes for profile lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_id ON user_profiles (tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_type ON user_profiles (user_type);
