/**
 * Billing Ledger Models
 * Task 1.1: Define ledger entry schema and storage types
 */

/**
 * Status of a ledger entry
 */
export type LedgerEntryStatus = 'unbilled' | 'billed' | 'voided';

/**
 * Ledger entry type (for categorization)
 */
export type LedgerEntryType =
  | 'screening'
  | 'verification'
  | 'document_review'
  | 'subscription'
  | 'addon'
  | 'adjustment'
  | 'credit';

/**
 * Ledger entry stored in database
 */
export interface LedgerEntry {
  id: string;
  tenantId: string;
  organizationId: string;
  entryType: LedgerEntryType;
  status: LedgerEntryStatus;
  description: string;
  quantity: number;
  unitPrice: number; // In cents
  totalAmount: number; // In cents (quantity * unitPrice)
  currency: string;
  referenceId?: string; // Reference to related entity (e.g., screening ID)
  referenceType?: string; // Type of reference (e.g., 'screening', 'subscription')
  billedAt?: Date;
  invoiceId?: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  createdByType: 'user' | 'system';
  finalizedAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Ledger entry response returned to clients
 */
export interface LedgerEntryResponse {
  id: string;
  entryType: LedgerEntryType;
  status: LedgerEntryStatus;
  description: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  referenceId?: string;
  referenceType?: string;
  billedAt?: Date;
  invoiceId?: string;
  createdAt: Date;
  finalizedAt?: Date;
}

/**
 * Filter options for ledger queries
 */
export interface LedgerFilterOptions {
  startDate?: Date;
  endDate?: Date;
  entryTypes?: LedgerEntryType[];
  minAmount?: number;
  maxAmount?: number;
  invoiceId?: string;
  referenceId?: string;
  referenceType?: string;
  page?: number;
  pageSize?: number;
  sortBy?: 'createdAt' | 'totalAmount' | 'billedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Ledger totals aggregation
 */
export interface LedgerTotals {
  entryCount: number;
  totalAmount: number;
  currency: string;
  byType: Record<LedgerEntryType, { count: number; amount: number }>;
}

/**
 * Paginated ledger response
 */
export interface LedgerListResponse {
  entries: LedgerEntryResponse[];
  totals: LedgerTotals;
  pagination: {
    page: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
  };
}

/**
 * Ledger entry creation request
 */
export interface CreateLedgerEntryRequest {
  entryType: LedgerEntryType;
  description: string;
  quantity: number;
  unitPrice: number;
  currency?: string;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Billing ledger SLO targets
 */
export const BILLING_LEDGER_SLOS = {
  // Latency SLOs (ms)
  LEDGER_LIST_LATENCY_P99_MS: 500,
  LEDGER_LIST_LATENCY_P95_MS: 200,
  LEDGER_TOTALS_LATENCY_P99_MS: 300,
  LEDGER_TOTALS_LATENCY_P95_MS: 150,

  // Availability SLOs (%)
  LEDGER_AVAILABILITY_RATE: 99.9,

  // Rate limiting SLOs
  MAX_LEDGER_RATE_LIMIT_HITS_PER_MINUTE: 20,

  // Caching TTLs (ms)
  LEDGER_TOTALS_CACHE_TTL_MS: 60000, // 1 minute
  LEDGER_LIST_CACHE_TTL_MS: 30000, // 30 seconds
} as const;

/**
 * Metric names for billing ledger
 */
export const BILLING_LEDGER_METRICS = {
  BILLED_LIST: 'billing_ledger_billed_list_total',
  UNBILLED_LIST: 'billing_ledger_unbilled_list_total',
  LEDGER_LATENCY: 'billing_ledger_latency_ms',
  ACCESS_DENIED: 'billing_ledger_access_denied_total',
  IMMUTABILITY_VIOLATION: 'billing_ledger_immutability_violation_total',
  RATE_LIMIT_HIT: 'billing_ledger_rate_limit_hit_total',
  CACHE_HIT: 'billing_ledger_cache_hit_total',
  CACHE_MISS: 'billing_ledger_cache_miss_total',
} as const;

/**
 * Audit event types for billing ledger
 */
export type BillingLedgerAuditEventType =
  | 'LEDGER_BILLED_LIST_READ'
  | 'LEDGER_UNBILLED_LIST_READ'
  | 'LEDGER_ACCESS_DENIED'
  | 'LEDGER_IMMUTABILITY_VIOLATION'
  | 'LEDGER_ENTRY_CREATED'
  | 'LEDGER_ENTRY_FINALIZED'
  | 'LEDGER_EXPORT_REQUESTED';

/**
 * Allowed roles for ledger access
 */
export const LEDGER_ACCESS_ROLES = ['system_admin', 'billing_admin', 'org_admin'] as const;
export type LedgerAccessRole = (typeof LEDGER_ACCESS_ROLES)[number];
