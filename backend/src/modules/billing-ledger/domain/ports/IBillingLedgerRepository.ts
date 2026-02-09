/**
 * Billing Ledger Repository Port
 */
import type {
  LedgerEntry,
  LedgerEntryStatus,
  LedgerFilterOptions,
  LedgerTotals,
} from '../entities/ledger.entity.js';

export interface IBillingLedgerRepository {
  createEntry(entry: LedgerEntry): Promise<void>;
  findById(tenantId: string, organizationId: string, id: string): Promise<LedgerEntry | undefined>;
  findBilledEntries(
    tenantId: string,
    organizationId: string,
    filters: LedgerFilterOptions
  ): Promise<{ entries: LedgerEntry[]; totalCount: number }>;
  findUnbilledEntries(
    tenantId: string,
    organizationId: string,
    filters: LedgerFilterOptions
  ): Promise<{ entries: LedgerEntry[]; totalCount: number }>;
  calculateTotals(
    tenantId: string,
    organizationId: string,
    status: LedgerEntryStatus,
    filters: LedgerFilterOptions
  ): Promise<LedgerTotals>;
  isEntryFinalized(tenantId: string, organizationId: string, id: string): Promise<boolean>;
  finalizeEntry(
    tenantId: string,
    organizationId: string,
    id: string,
    invoiceId: string
  ): Promise<LedgerEntry | undefined>;
  updateEntry(
    tenantId: string,
    organizationId: string,
    id: string,
    updates: Partial<Pick<LedgerEntry, 'description' | 'metadata'>>
  ): Promise<{ success: boolean; entry?: LedgerEntry; error?: string }>;
}
