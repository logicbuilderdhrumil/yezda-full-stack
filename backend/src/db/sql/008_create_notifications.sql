-- Notifications table
-- Task 1.1: Define notification model and retention rules

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('user', 'candidate')),
    type VARCHAR(50) NOT NULL CHECK (type IN ('SYSTEM', 'APPLICATION', 'SCREENING', 'DOCUMENT', 'MESSAGE', 'SECURITY', 'REMINDER')),
    priority VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read')),
    action_url VARCHAR(2048),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Index for fetching notifications by user in reverse chronological order
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON notifications (tenant_id, user_id, user_type, created_at DESC);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_notifications_user_status 
ON notifications (tenant_id, user_id, user_type, status, created_at DESC);

-- Index for filtering by type
CREATE INDEX IF NOT EXISTS idx_notifications_user_type_filter 
ON notifications (tenant_id, user_id, user_type, type, created_at DESC);

-- Index for cleanup of expired notifications
CREATE INDEX IF NOT EXISTS idx_notifications_expires 
ON notifications (expires_at) WHERE expires_at IS NOT NULL;

-- Index for unread count queries
CREATE INDEX IF NOT EXISTS idx_notifications_unread_count 
ON notifications (tenant_id, user_id, user_type) WHERE status = 'unread';

-- Comment on table
COMMENT ON TABLE notifications IS 'Stores user notifications with retention policies and read status';
