-- Migration: 012_create_files.sql
-- Creates the files table for file management feature
-- Supports file metadata, tenant isolation, scan status, and soft delete

CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  uploader_id VARCHAR(255) NOT NULL,
  uploader_type VARCHAR(20) NOT NULL CHECK (uploader_type IN ('user', 'candidate')),
  filename VARCHAR(500) NOT NULL,
  original_filename VARCHAR(500) NOT NULL,
  mime_type VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  storage_key VARCHAR(1000) NOT NULL,
  storage_adapter VARCHAR(20) NOT NULL CHECK (storage_adapter IN ('local', 's3')),
  checksum VARCHAR(64),
  scan_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (scan_status IN ('pending', 'clean', 'infected', 'error')),
  scan_result TEXT,
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_files_tenant_id ON files(tenant_id);
CREATE INDEX IF NOT EXISTS idx_files_uploader_id ON files(uploader_id);
CREATE INDEX IF NOT EXISTS idx_files_expires_at ON files(expires_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_files_scan_status ON files(scan_status) WHERE deleted_at IS NULL;
