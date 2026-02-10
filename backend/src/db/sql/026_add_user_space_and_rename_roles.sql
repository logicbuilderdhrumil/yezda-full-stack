-- Migration 026: Add user_space column and rename roles for hierarchical RBAC
-- Phase 1 of backend-add-hierarchical-rbac change proposal

BEGIN;

-- 1. Add user_space column with default 'platform'
ALTER TABLE managed_users
  ADD COLUMN IF NOT EXISTS user_space VARCHAR(20) NOT NULL DEFAULT 'platform'
  CHECK (user_space IN ('platform', 'organization'));

-- 2. Update existing rows: set user_space = 'organization' for client/client_admin users
UPDATE managed_users
  SET user_space = 'organization'
  WHERE roles && ARRAY['client', 'client_admin']::text[];

-- 3. Rename roles atomically
UPDATE managed_users
  SET roles = (
    SELECT array_agg(
      CASE r
        WHEN 'admin'        THEN 'platform_admin'
        WHEN 'manager'      THEN 'platform_manager'
        WHEN 'agent'        THEN 'platform_agent'
        WHEN 'viewer'       THEN 'platform_viewer'
        WHEN 'client_admin' THEN 'org_admin'
        WHEN 'client'       THEN 'org_viewer'
        ELSE r
      END
    )
    FROM unnest(roles) AS r
  )
  WHERE roles && ARRAY['admin', 'manager', 'agent', 'viewer', 'client', 'client_admin']::text[];

-- 4. Add index on user_space for query performance
CREATE INDEX IF NOT EXISTS idx_managed_users_user_space ON managed_users (user_space);

-- 5. Update column comment
COMMENT ON COLUMN managed_users.roles IS 'User roles: platform_admin, platform_manager, platform_agent, platform_viewer, org_admin, org_manager, org_viewer';

COMMIT;
