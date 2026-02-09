/**
 * Ledger module mock fixtures.
 * Provides fake data for billing ledger endpoints.
 * Organization IDs are consistent with organizations fixtures.
 */

/** Mock ledger entry type matching frontend LedgerEntry. */
export interface MockLedgerEntry {
  id: string;
  organizationId: string;
  organizationName: string;
  description: string;
  amount: number;
  currency: string;
  status: 'billed' | 'unbilled' | 'pending' | 'void';
  billedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Predefined mock ledger entries. */
export const mockLedgerEntries: MockLedgerEntry[] = [
  {
    id: 'ledger-001',
    organizationId: 'org-001',
    organizationName: 'Acme Corp',
    description: 'Standard Background Check × 12 candidates',
    amount: 1440.0,
    currency: 'GBP',
    status: 'billed',
    billedAt: '2026-02-02T09:00:00.000Z',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-02T09:00:00.000Z',
  },
  {
    id: 'ledger-002',
    organizationId: 'org-002',
    organizationName: 'Global Staffing Ltd',
    description: 'Quick Pre-Screen × 8 candidates',
    amount: 320.0,
    currency: 'GBP',
    status: 'billed',
    billedAt: '2026-01-29T10:00:00.000Z',
    createdAt: '2026-01-28T00:00:00.000Z',
    updatedAt: '2026-01-29T10:00:00.000Z',
  },
  {
    id: 'ledger-003',
    organizationId: 'org-001',
    organizationName: 'Acme Corp',
    description: 'Executive Screening × 2 candidates',
    amount: 960.0,
    currency: 'GBP',
    status: 'unbilled',
    createdAt: '2026-02-05T00:00:00.000Z',
    updatedAt: '2026-02-05T00:00:00.000Z',
  },
  {
    id: 'ledger-004',
    organizationId: 'org-003',
    organizationName: 'TechVentures Inc',
    description: 'Monthly platform subscription — February 2026',
    amount: 199.0,
    currency: 'GBP',
    status: 'billed',
    billedAt: '2026-02-01T12:00:00.000Z',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T12:00:00.000Z',
  },
  {
    id: 'ledger-005',
    organizationId: 'org-002',
    organizationName: 'Global Staffing Ltd',
    description: 'Additional identity verification add-on',
    amount: 75.0,
    currency: 'GBP',
    status: 'pending',
    createdAt: '2026-02-07T00:00:00.000Z',
    updatedAt: '2026-02-07T00:00:00.000Z',
  },
];

/** Compute summary totals matching LedgerSummary. */
function computeSummary() {
  const totalAmount = mockLedgerEntries.reduce((sum, e) => sum + e.amount, 0);
  return { totalAmount, entryCount: mockLedgerEntries.length, currency: 'GBP' };
}

/** Mock ledger list response matching LedgerListResponse. */
export const ledgerListResponse = {
  data: mockLedgerEntries,
  meta: {
    page: 1,
    pageSize: 10,
    totalItems: mockLedgerEntries.length,
    totalPages: 1,
  },
  summary: computeSummary(),
};
