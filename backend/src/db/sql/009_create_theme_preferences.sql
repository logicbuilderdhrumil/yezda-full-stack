-- Theme Preferences table
-- Task 1.3: Persist and retrieve theme preferences

CREATE TABLE IF NOT EXISTS theme_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'candidate')),
    preset_id VARCHAR(50) NOT NULL CHECK (preset_id IN ('light', 'dark', 'high-contrast')),
    custom_tokens JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    -- Unique constraint for tenant + user + user_type combination
    CONSTRAINT uq_theme_preferences_user UNIQUE (tenant_id, user_id, user_type)
);

-- Index for fetching preference by user
CREATE INDEX IF NOT EXISTS idx_theme_preferences_user 
ON theme_preferences (tenant_id, user_id, user_type);

-- Index for admin queries by tenant
CREATE INDEX IF NOT EXISTS idx_theme_preferences_tenant 
ON theme_preferences (tenant_id);

-- Comment on table
COMMENT ON TABLE theme_preferences IS 'Stores user theme preferences with preset selection and custom token overrides';
