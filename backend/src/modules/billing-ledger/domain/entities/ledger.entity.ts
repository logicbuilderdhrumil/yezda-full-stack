/**
 * Billing Ledger Domain Entities
 * Migrated from legacy billing-ledger.model.ts
 */

// --- Status & Type Enums ---

export type LedgerEntryStatus = 'unbilled' | 'billed' | 'voided';

export type LedgerEntryType =
  | 'screening'
  | 'verification'
  | 'document_review'
  | 'subscription'
  | 'addon'
  | 'adjustment'
  | 'credit';

// --- Core Entities ---

export interface LedgerEntry {
  id: string;
  tenantId: string;
  organizationId: string;
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
  updatedAt: Date;
  createdBy: string;
  createdByType: 'user' | 'system';
  finalizedAt?: Date;
  metadata?: Record<string, unknown>;
}

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

export interface LedgerTotals {
  entryCount: number;
  totalAmount: number;
  currency: string;
  byType: Record<LedgerEntryType, { count: number; amount: number }>;
}

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

// --- Constants ---

export const BILLING_LEDGER_SLOS = {
  LEDGER_LIST_LATENCY_P99_MS: 500,
  LEDGER_LIST_LATENCY_P95_MS: 200,
  LEDGER_TOTALS_LATENCY_P99_MS: 300,
  LEDGER_TOTALS_LATENCY_P95_MS: 150,
  LEDGER_AVAILABILITY_RATE: 99.9,
  MAX_LEDGER_RATE_LIMIT_HITS_PER_MINUTE: 20,
  LEDGER_TOTALS_CACHE_TTL_MS: 60000,
  LEDGER_LIST_CACHE_TTL_MS: 30000,
} as const;

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

export type BillingLedgerAuditEventType =
  | 'LEDGER_BILLED_LIST_READ'
  | 'LEDGER_UNBILLED_LIST_READ'
  | 'LEDGER_ACCESS_DENIED'
  | 'LEDGER_IMMUTABILITY_VIOLATION'
  | 'LEDGER_ENTRY_CREATED'
  | 'LEDGER_ENTRY_FINALIZED'
  | 'LEDGER_EXPORT_REQUESTED';

export const LEDGER_ACCESS_ROLES = ['system_admin', 'billing_admin', 'org_admin'] as const;
export type LedgerAccessRole = (typeof LEDGER_ACCESS_ROLES)[number];

// --- Helpers ---

export function toEntryResponse(entry: LedgerEntry): LedgerEntryResponse {
  return {
    id: entry.id,
    entryType: entry.entryType,
    status: entry.status,
    description: entry.description,
    quantity: entry.quantity,
    unitPrice: entry.unitPrice,
    totalAmount: entry.totalAmount,
    currency: entry.currency,
    referenceId: entry.referenceId,
    referenceType: entry.referenceType,
    billedAt: entry.billedAt,
    invoiceId: entry.invoiceId,
    createdAt: entry.createdAt,
    finalizedAt: entry.finalizedAt,
  };
}

export function hasLedgerAccess(userRoles: string[]): boolean {
  const allowedRoles: readonly string[] = LEDGER_ACCESS_ROLES;
  return userRoles.some((role) => allowedRoles.includes(role));
}

// --- Request Context ---

export interface RequestContext {
  userId: string;
  userType: 'user' | 'candidate';
  tenantId: string;
  ipAddress?: string;
  channel?: 'web' | 'mobile' | 'api';
}

export type OperationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };
