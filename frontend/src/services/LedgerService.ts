/**
 * Ledger service for API interactions.
 */
import { ApiService } from './ApiService';
import type {
  LedgerListParams,
  LedgerListResponse,
} from '@/@types/ledger';

/**
 * LedgerService provides methods for ledger entry operations.
 */
export const LedgerService = {
  /**
   * Fetches a paginated list of billed ledger entries.
   * @param params - Optional filter and pagination parameters
   * @returns Paginated list of billed ledger entries with summary
   */
  async listBilled(params?: Omit<LedgerListParams, 'status'>): Promise<LedgerListResponse> {
    const queryParams: Record<string, string> = { status: 'billed' };
    if (params?.page !== undefined) queryParams.page = String(params.page);
    if (params?.pageSize !== undefined) queryParams.pageSize = String(params.pageSize);
    if (params?.organizationId) queryParams.organizationId = params.organizationId;
    if (params?.dateFrom) queryParams.dateFrom = params.dateFrom;
    if (params?.dateTo) queryParams.dateTo = params.dateTo;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;

    const response = await ApiService.get<LedgerListResponse>('ledger.list', {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * Fetches a paginated list of unbilled ledger entries.
   * @param params - Optional filter and pagination parameters
   * @returns Paginated list of unbilled ledger entries with summary
   */
  async listUnbilled(params?: Omit<LedgerListParams, 'status'>): Promise<LedgerListResponse> {
    const queryParams: Record<string, string> = { status: 'unbilled' };
    if (params?.page !== undefined) queryParams.page = String(params.page);
    if (params?.pageSize !== undefined) queryParams.pageSize = String(params.pageSize);
    if (params?.organizationId) queryParams.organizationId = params.organizationId;
    if (params?.dateFrom) queryParams.dateFrom = params.dateFrom;
    if (params?.dateTo) queryParams.dateTo = params.dateTo;
    if (params?.sortBy) queryParams.sortBy = params.sortBy;
    if (params?.sortOrder) queryParams.sortOrder = params.sortOrder;

    const response = await ApiService.get<LedgerListResponse>('ledger.list', {
      params: queryParams,
    });
    return response.data;
  },

  /**
   * Exports ledger entries as CSV.
   * @param params - Filter parameters for export
   * @returns Blob containing CSV data
   */
  async exportCsv(params?: LedgerListParams): Promise<Blob> {
    const queryParams: Record<string, string> = { format: 'csv' };
    if (params?.status) queryParams.status = params.status;
    if (params?.organizationId) queryParams.organizationId = params.organizationId;
    if (params?.dateFrom) queryParams.dateFrom = params.dateFrom;
    if (params?.dateTo) queryParams.dateTo = params.dateTo;

    const response = await ApiService.get<Blob>('ledger.export', {
      params: queryParams,
      responseType: 'blob',
    });
    return response.data;
  },
};
