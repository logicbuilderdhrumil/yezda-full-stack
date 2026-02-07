/**
 * DashboardService tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DashboardService } from './DashboardService';
import { ApiService } from './ApiService';

// Mock ApiService
vi.mock('./ApiService', () => ({
  ApiService: {
    get: vi.fn(),
  },
}));

// Backend response mocks (mirrors backend shapes)
const mockBackendSummary = {
  tenantId: 'tenant-1',
  timestamp: '2026-02-04T10:30:00Z',
  timeRange: '7d',
  kpis: [
    {
      type: 'active_users',
      label: 'Total Users',
      value: 1234,
      trend: { direction: 'up', percentage: 12, comparisonPeriod: 'previous 7d' },
    },
    {
      type: 'completed_tasks',
      label: 'Active Screenings',
      value: 42,
      trend: { direction: 'down', percentage: 5, comparisonPeriod: 'previous 7d' },
    },
  ],
  recentActivity: [
    {
      id: 'act-1',
      type: 'user_signup',
      title: 'New candidate John Doe added',
      actorName: 'Admin User',
      timestamp: '2026-02-04T10:00:00Z',
    },
    {
      id: 'act-2',
      type: 'task_completed',
      title: 'Screening completed for Jane Smith',
      timestamp: '2026-02-04T09:30:00Z',
    },
  ],
  activityTotal: 100,
};

const mockBackendTrends = {
  tenantId: 'tenant-1',
  timeRange: '7d',
  series: [
    {
      metric: 'completed_tasks',
      label: 'Weekly Screenings',
      aggregation: 'daily',
      data: [
        { timestamp: '2026-02-01T00:00:00Z', value: 12 },
        { timestamp: '2026-02-02T00:00:00Z', value: 19 },
        { timestamp: '2026-02-03T00:00:00Z', value: 15 },
      ],
    },
  ],
};

/** Helper to mock ApiService.get based on endpoint name */
function mockApiGet() {
  vi.mocked(ApiService.get).mockImplementation((endpoint: string) => {
    if (endpoint === 'dashboard.metrics') {
      return Promise.resolve({ data: mockBackendSummary });
    }
    if (endpoint === 'dashboard.trends') {
      return Promise.resolve({ data: mockBackendTrends });
    }
    return Promise.reject(new Error(`Unexpected endpoint: ${endpoint}`));
  });
}

describe('DashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    DashboardService.clearCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getMetrics', () => {
    it('fetches and transforms dashboard metrics from the API', async () => {
      mockApiGet();

      const result = await DashboardService.getMetrics();

      // Verify both endpoints were called
      expect(ApiService.get).toHaveBeenCalledWith('dashboard.metrics');
      expect(ApiService.get).toHaveBeenCalledWith('dashboard.trends');

      // Verify KPIs transformed correctly
      expect(result.kpis).toHaveLength(2);
      expect(result.kpis[0]).toEqual({
        id: 'active_users',
        title: 'Total Users',
        value: 1234,
        formattedValue: undefined,
        delta: 12,
        deltaDirection: 'up',
        deltaText: '+12%',
      });
      expect(result.kpis[1]).toEqual({
        id: 'completed_tasks',
        title: 'Active Screenings',
        value: 42,
        formattedValue: undefined,
        delta: 5,
        deltaDirection: 'down',
        deltaText: '-5%',
      });

      // Verify activities transformed correctly
      expect(result.activities).toHaveLength(2);
      expect(result.activities[0]).toEqual({
        id: 'act-1',
        type: 'user_created',
        message: 'New candidate John Doe added',
        timestamp: '2026-02-04T10:00:00Z',
        actor: 'Admin User',
      });
      expect(result.activities[1]).toEqual({
        id: 'act-2',
        type: 'screening_completed',
        message: 'Screening completed for Jane Smith',
        timestamp: '2026-02-04T09:30:00Z',
        actor: undefined,
      });

      // Verify charts transformed correctly
      expect(result.charts).toHaveLength(1);
      expect(result.charts[0].id).toBe('completed_tasks');
      expect(result.charts[0].title).toBe('Weekly Screenings');
      expect(result.charts[0].type).toBe('line'); // first item, index 0 -> line
      expect(result.charts[0].data).toHaveLength(3);

      // Verify lastUpdated
      expect(result.lastUpdated).toBe('2026-02-04T10:30:00Z');
    });

    it('returns cached data on subsequent calls within cache TTL', async () => {
      mockApiGet();

      // First call
      const result1 = await DashboardService.getMetrics();
      // Second call (should use cache)
      const result2 = await DashboardService.getMetrics();

      // API should only be called twice total (once for each endpoint on first call)
      expect(ApiService.get).toHaveBeenCalledTimes(2);
      expect(result1).toEqual(result2);
    });

    it('bypasses cache when force option is true', async () => {
      mockApiGet();

      // First call
      await DashboardService.getMetrics();
      // Second call with force
      await DashboardService.getMetrics({ force: true });

      // API should be called 4 times (2 endpoints x 2 calls)
      expect(ApiService.get).toHaveBeenCalledTimes(4);
    });

    it('refetches after cache expires', async () => {
      vi.useFakeTimers();
      mockApiGet();

      // First call
      await DashboardService.getMetrics();

      // Advance time past cache TTL (1 minute)
      vi.advanceTimersByTime(61_000);

      // Second call (should refetch)
      await DashboardService.getMetrics();

      // API should be called 4 times (2 endpoints x 2 calls)
      expect(ApiService.get).toHaveBeenCalledTimes(4);
    });

    it('handles trends endpoint failure gracefully', async () => {
      vi.mocked(ApiService.get).mockImplementation((endpoint: string) => {
        if (endpoint === 'dashboard.metrics') {
          return Promise.resolve({ data: mockBackendSummary });
        }
        if (endpoint === 'dashboard.trends') {
          return Promise.reject(new Error('Trends unavailable'));
        }
        return Promise.reject(new Error(`Unexpected endpoint: ${endpoint}`));
      });

      const result = await DashboardService.getMetrics();

      // Should still return KPIs and activities
      expect(result.kpis).toHaveLength(2);
      expect(result.activities).toHaveLength(2);
      // Charts should be empty when trends fails
      expect(result.charts).toEqual([]);
    });
  });

  describe('clearCache', () => {
    it('clears the cached data', async () => {
      mockApiGet();

      // First call
      await DashboardService.getMetrics();

      // Clear cache
      DashboardService.clearCache();

      // Next call should fetch again
      await DashboardService.getMetrics();

      // API should be called 4 times (2 endpoints x 2 calls)
      expect(ApiService.get).toHaveBeenCalledTimes(4);
    });
  });

  describe('refresh', () => {
    it('forces a refresh of dashboard metrics', async () => {
      mockApiGet();

      // First call
      await DashboardService.getMetrics();

      // Refresh
      await DashboardService.refresh();

      // API should be called 4 times (2 endpoints x 2 calls)
      expect(ApiService.get).toHaveBeenCalledTimes(4);
    });
  });
});
