/**
 * Billing Ledger Service
 * Integration layer for billing ledger operations.
 */

import { ApiService } from '@/services/ApiService';
import type {
  LedgerEntryDTO,
  LedgerEntryListResponseDTO,
  CreateLedgerEntryRequest,
  LedgerEntryType,
  BillingStatus,
} from '@/@types/contracts';

/** Ledger filter options. */
export interface LedgerFilterOptions {
  startDate?: string;
  endDate?: string;
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

/** Update ledger entry request. */
export interface UpdateLedgerEntryRequest {
  description?: string;
  metadata?: Record<string, unknown>;
}

/** Finalize entry request. */
export interface FinalizeEntryRequest {
  invoiceId: string;
}

/**
 * BillingService provides methods for billing ledger operations.
 */
export const BillingService = {
  /**
   * Gets billed entries for an organization.
   */
  async getBilledEntries(
    organizationId: string,
    options?: LedgerFilterOptions
  ): Promise<LedgerEntryListResponseDTO> {
    const params = formatFilterParams(options);
    const response = await ApiService.get<LedgerEntryListResponseDTO>(
      'billing.billedEntries',
      {
        pathParams: { organizationId },
        params,
      }
    );
    return response.data;
  },

  /**
   * Gets unbilled entries for an organization.
   */
  async getUnbilledEntries(
    organizationId: string,
    options?: LedgerFilterOptions
  ): Promise<LedgerEntryListResponseDTO> {
    const params = formatFilterParams(options);
    const response = await ApiService.get<LedgerEntryListResponseDTO>(
      'billing.unbilledEntries',
      {
        pathParams: { organizationId },
        params,
      }
    );
    return response.data;
  },

  /**
   * Creates a new ledger entry.
   */
  async createEntry(
    organizationId: string,
    data: CreateLedgerEntryRequest
  ): Promise<LedgerEntryDTO> {
    const response = await ApiService.post<LedgerEntryDTO>(
      'billing.createEntry',
      data,
      { pathParams: { organizationId } }
    );
    return response.data;
  },

  /**
   * Updates a ledger entry.
   */
  async updateEntry(
    organizationId: string,
    entryId: string,
    data: UpdateLedgerEntryRequest
  ): Promise<LedgerEntryDTO> {
    const response = await ApiService.patch<LedgerEntryDTO>(
      'billing.updateEntry',
      data,
      { pathParams: { organizationId, entryId } }
    );
    return response.data;
  },

  /**
   * Finalizes a ledger entry (marks as billed).
   */
  async finalizeEntry(
    organizationId: string,
    entryId: string,
    data: FinalizeEntryRequest
  ): Promise<LedgerEntryDTO> {
    const response = await ApiService.post<LedgerEntryDTO>(
      'billing.finalizeEntry',
      data,
      { pathParams: { organizationId, entryId } }
    );
    return response.data;
  },

  /**
   * Gets summary of ledger entries.
   */
  async getSummary(
    organizationId: string,
    status: BillingStatus
  ): Promise<{ totalAmount: number; entryCount: number; currency: string }> {
    const method = status === 'billed' ? 'getBilledEntries' : 'getUnbilledEntries';
    const result = await this[method](organizationId, { pageSize: 0 });
    return result.summary ?? { totalAmount: 0, entryCount: 0, currency: 'USD' };
  },
};

/**
 * Formats filter options for API query params.
 */
function formatFilterParams(
  options?: LedgerFilterOptions
): Record<string, string> | undefined {
  if (!options) return undefined;

  const params: Record<string, string> = {};

  if (options.startDate) params.startDate = options.startDate;
  if (options.endDate) params.endDate = options.endDate;
  if (options.entryTypes?.length) params.entryTypes = options.entryTypes.join(',');
  if (options.minAmount !== undefined) params.minAmount = String(options.minAmount);
  if (options.maxAmount !== undefined) params.maxAmount = String(options.maxAmount);
  if (options.invoiceId) params.invoiceId = options.invoiceId;
  if (options.referenceId) params.referenceId = options.referenceId;
  if (options.referenceType) params.referenceType = options.referenceType;
  if (options.page !== undefined) params.page = String(options.page);
  if (options.pageSize !== undefined) params.pageSize = String(options.pageSize);
  if (options.sortBy) params.sortBy = options.sortBy;
  if (options.sortOrder) params.sortOrder = options.sortOrder;

  return Object.keys(params).length > 0 ? params : undefined;
}
