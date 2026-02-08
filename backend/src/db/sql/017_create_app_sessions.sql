-- Create app_sessions table for mobile/web app session management
-- Used by app-auth flow for device-specific session tracking

CREATE TABLE IF NOT EXISTS app_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  user_type VARCHAR(20) NOT NULL DEFAULT 'candidate',
  refresh_token_hash VARCHAR(64) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  app_version VARCHAR(50) NOT NULL,
  os_version VARCHAR(50),
  model VARCHAR(100),
  ip_address INET,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  rotated_from_id UUID REFERENCES app_sessions(id),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common lookup patterns
CREATE INDEX IF NOT EXISTS idx_app_sessions_user_id ON app_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_app_sessions_refresh_token_hash ON app_sessions(refresh_token_hash);
CREATE INDEX IF NOT EXISTS idx_app_sessions_device_id ON app_sessions(user_id, device_id);
CREATE INDEX IF NOT EXISTS idx_app_sessions_expires_at ON app_sessions(expires_at);
