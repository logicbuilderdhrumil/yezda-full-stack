-- Migration: Create audit logs table
-- Version: 005
-- Description: Authentication audit trail for compliance

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    actor_id UUID,
    actor_type VARCHAR(20) CHECK (actor_type IN ('user', 'candidate', 'system')),
    target_id UUID,
    target_type VARCHAR(50),
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('web', 'mobile', 'api')),
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs (target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_time ON audit_logs (actor_id, timestamp DESC);
