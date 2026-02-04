/**
 * DashboardService tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DashboardService } from './DashboardService';
import { ApiService } from './ApiService';
import type { DashboardMetricsResponse } from '@/@types';

// Mock ApiService
vi.mock('./ApiService', () => ({
  ApiService: {
    get: vi.fn(),
  },
}));

const mockMetrics: DashboardMetricsResponse = {
  kpis: [
    {
      id: 'kpi-1',
      title: 'Total Users',
      value: 1234,
      formattedValue: '1,234',
      deltaText: '+12%',
      deltaDirection: 'up',
    },
    {
      id: 'kpi-2',
      title: 'Active Screenings',
      value: 42,
      deltaText: '-5%',
      deltaDirection: 'down',
    },
  ],
  activities: [
    {
      id: 'act-1',
      type: 'candidate_added',
      message: 'New candidate John Doe added',
      timestamp: '2026-02-04T10:00:00Z',
      actor: 'Admin User',
    },
    {
      id: 'act-2',
      type: 'screening_completed',
      message: 'Screening completed for Jane Smith',
      timestamp: '2026-02-04T09:30:00Z',
    },
  ],
  charts: [
    {
      id: 'chart-1',
      title: 'Weekly Screenings',
      type: 'bar',
      data: [
        { label: 'Mon', value: 12 },
        { label: 'Tue', value: 19 },
        { label: 'Wed', value: 15 },
        { label: 'Thu', value: 22 },
        { label: 'Fri', value: 18 },
      ],
    },
  ],
  lastUpdated: '2026-02-04T10:30:00Z',
};

describe('DashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    DashboardService.clearCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getMetrics', () => {
    it('fetches dashboard metrics from the API', async () => {
      vi.mocked(ApiService.get).mockResolvedValueOnce({ data: mockMetrics });

      const result = await DashboardService.getMetrics();

      expect(ApiService.get).toHaveBeenCalledWith('dashboard.metrics');
      expect(result).toEqual(mockMetrics);
    });

    it('returns cached data on subsequent calls within cache TTL', async () => {
      vi.mocked(ApiService.get).mockResolvedValueOnce({ data: mockMetrics });

      // First call
      const result1 = await DashboardService.getMetrics();
      // Second call (should use cache)
      const result2 = await DashboardService.getMetrics();

      expect(ApiService.get).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });

    it('bypasses cache when force option is true', async () => {
      vi.mocked(ApiService.get).mockResolvedValue({ data: mockMetrics });

      // First call
      await DashboardService.getMetrics();
      // Second call with force
      await DashboardService.getMetrics({ force: true });

      expect(ApiService.get).toHaveBeenCalledTimes(2);
    });

    it('refetches after cache expires', async () => {
      vi.useFakeTimers();
      vi.mocked(ApiService.get).mockResolvedValue({ data: mockMetrics });

      // First call
      await DashboardService.getMetrics();

      // Advance time past cache TTL (1 minute)
      vi.advanceTimersByTime(61_000);

      // Second call (should refetch)
      await DashboardService.getMetrics();

      expect(ApiService.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('clearCache', () => {
    it('clears the cached data', async () => {
      vi.mocked(ApiService.get).mockResolvedValue({ data: mockMetrics });

      // First call
      await DashboardService.getMetrics();

      // Clear cache
      DashboardService.clearCache();

      // Next call should fetch again
      await DashboardService.getMetrics();

      expect(ApiService.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('refresh', () => {
    it('forces a refresh of dashboard metrics', async () => {
      vi.mocked(ApiService.get).mockResolvedValue({ data: mockMetrics });

      // First call
      await DashboardService.getMetrics();

      // Refresh
      await DashboardService.refresh();

      expect(ApiService.get).toHaveBeenCalledTimes(2);
    });
  });
});
