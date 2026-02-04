-- Migration: Create ledger_entries table for billing ledger
-- This table stores billing ledger entries with immutability and audit support

CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  organization_id VARCHAR(255) NOT NULL,
  entry_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  reference_id VARCHAR(255),
  reference_type VARCHAR(100),
  billed_at TIMESTAMPTZ,
  invoice_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255) NOT NULL,
  created_by_type VARCHAR(20) NOT NULL,
  finalized_at TIMESTAMPTZ,
  metadata JSONB
);

-- Indexes for common query patterns
CREATE INDEX idx_ledger_entries_tenant_org ON ledger_entries(tenant_id, organization_id);
CREATE INDEX idx_ledger_entries_status ON ledger_entries(tenant_id, organization_id, status);
CREATE INDEX idx_ledger_entries_created ON ledger_entries(tenant_id, organization_id, created_at);
CREATE INDEX idx_ledger_entries_invoice ON ledger_entries(invoice_id) WHERE invoice_id IS NOT NULL;
