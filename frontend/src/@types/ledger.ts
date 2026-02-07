/**
 * Ledger-related types for the frontend.
 */

/** Ledger entry status. */
export type LedgerEntryStatus = 'billed' | 'unbilled' | 'pending' | 'void';

/** Ledger entry record. */
export interface LedgerEntry {
  id: string;
  organizationId: string;
  organizationName: string;
  description: string;
  amount: number;
  currency: string;
  status: LedgerEntryStatus;
  billedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** Summary totals for ledger. */
export interface LedgerSummary {
  totalAmount: number;
  entryCount: number;
  currency: string;
}

/** Filter parameters for listing ledger entries. */
export interface LedgerListParams {
  page?: number | undefined;
  pageSize?: number | undefined;
  status?: LedgerEntryStatus | undefined;
  organizationId?: string | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  sortBy?: 'createdAt' | 'billedAt' | 'amount' | 'organizationName' | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}

/** Paginated list response for ledger entries. */
export interface LedgerListResponse {
  data: LedgerEntry[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  summary: LedgerSummary;
}

/** Table column definition for ledger. */
export interface LedgerColumn {
  key: keyof LedgerEntry | 'actions';
  label: string;
  sortable?: boolean;
  width?: string;
}

/** Default columns for the billed ledger list. */
export const BILLED_LEDGER_COLUMNS: LedgerColumn[] = [
  { key: 'organizationName', label: 'Organization', sortable: true },
  { key: 'description', label: 'Description', sortable: false },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'billedAt', label: 'Billed Date', sortable: true },
  { key: 'createdAt', label: 'Created', sortable: true },
];

/** Default columns for the unbilled ledger list. */
export const UNBILLED_LEDGER_COLUMNS: LedgerColumn[] = [
  { key: 'organizationName', label: 'Organization', sortable: true },
  { key: 'description', label: 'Description', sortable: false },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'createdAt', label: 'Created', sortable: true },
];
