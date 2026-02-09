/**
 * Unit tests for LedgerService.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LedgerService } from './LedgerService';
import { ApiService } from '@/services/ApiService';
import type { InternalAxiosRequestConfig } from 'axios';

// Helper to create mock responses with full AxiosResponse shape
const mockAxiosResponse = <T>(data: T) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as InternalAxiosRequestConfig,
});

vi.mock('@/services/ApiService', () => ({
  ApiService: {
    get: vi.fn(),
  },
}));

describe('LedgerService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listBilled', () => {
    it('fetches billed ledger entries with status filter', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: '1',
              organizationId: 'org1',
              organizationName: 'Test Org',
              description: 'Service fee',
              amount: 100,
              currency: 'USD',
              status: 'billed',
              billedAt: '2025-01-15T00:00:00Z',
              createdAt: '2025-01-01T00:00:00Z',
              updatedAt: '2025-01-15T00:00:00Z',
            },
          ],
          meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
          summary: { totalAmount: 100, entryCount: 1, currency: 'USD' },
        },
      };
      vi.mocked(ApiService.get).mockResolvedValueOnce(mockAxiosResponse(mockResponse.data));

      const result = await LedgerService.listBilled({ page: 1, pageSize: 10 });

      expect(ApiService.get).toHaveBeenCalledWith('ledger.list', {
        params: { status: 'billed', page: '1', pageSize: '10' },
      });
      expect(result.data).toHaveLength(1);
      expect(result.summary.totalAmount).toBe(100);
    });

    it('includes date filters when provided', async () => {
      const mockResponse = {
        data: { data: [], meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 }, summary: { totalAmount: 0, entryCount: 0, currency: 'USD' } },
      };
      vi.mocked(ApiService.get).mockResolvedValueOnce(mockAxiosResponse(mockResponse.data));

      await LedgerService.listBilled({ dateFrom: '2025-01-01', dateTo: '2025-01-31' });

      expect(ApiService.get).toHaveBeenCalledWith('ledger.list', {
        params: { status: 'billed', dateFrom: '2025-01-01', dateTo: '2025-01-31' },
      });
    });
  });

  describe('listUnbilled', () => {
    it('fetches unbilled ledger entries with status filter', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: '2',
              organizationId: 'org1',
              organizationName: 'Test Org',
              description: 'Pending charge',
              amount: 50,
              currency: 'USD',
              status: 'unbilled',
              createdAt: '2025-01-20T00:00:00Z',
              updatedAt: '2025-01-20T00:00:00Z',
            },
          ],
          meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 },
          summary: { totalAmount: 50, entryCount: 1, currency: 'USD' },
        },
      };
      vi.mocked(ApiService.get).mockResolvedValueOnce(mockAxiosResponse(mockResponse.data));

      const result = await LedgerService.listUnbilled({ page: 1 });

      expect(ApiService.get).toHaveBeenCalledWith('ledger.list', {
        params: { status: 'unbilled', page: '1' },
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.status).toBe('unbilled');
    });

    it('includes organization filter when provided', async () => {
      const mockResponse = {
        data: { data: [], meta: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 }, summary: { totalAmount: 0, entryCount: 0, currency: 'USD' } },
      };
      vi.mocked(ApiService.get).mockResolvedValueOnce(mockAxiosResponse(mockResponse.data));

      await LedgerService.listUnbilled({ organizationId: 'org123' });

      expect(ApiService.get).toHaveBeenCalledWith('ledger.list', {
        params: { status: 'unbilled', organizationId: 'org123' },
      });
    });
  });

  describe('exportCsv', () => {
    it('requests CSV export with filters', async () => {
      const mockBlob = new Blob(['id,amount'], { type: 'text/csv' });
      vi.mocked(ApiService.get).mockResolvedValueOnce(mockAxiosResponse(mockBlob));

      const result = await LedgerService.exportCsv({ status: 'billed', organizationId: 'org1' });

      expect(ApiService.get).toHaveBeenCalledWith('ledger.export', {
        params: { format: 'csv', status: 'billed', organizationId: 'org1' },
        responseType: 'blob',
      });
      expect(result).toBeInstanceOf(Blob);
    });
  });
});
