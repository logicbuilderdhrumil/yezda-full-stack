-- Create invite_tokens table for email invite flow
CREATE TABLE IF NOT EXISTS invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('org_member_invite', 'candidate_invite')),
  email VARCHAR(255) NOT NULL,
  tenant_id VARCHAR(100) NOT NULL,
  invited_by_user_id VARCHAR(100) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'consumed', 'expired', 'revoked'))
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_invite_tokens_hash ON invite_tokens (token_hash);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_email_type_tenant ON invite_tokens (email, type, tenant_id);
CREATE INDEX IF NOT EXISTS idx_invite_tokens_status ON invite_tokens (status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_invite_tokens_created_at ON invite_tokens (created_at);
