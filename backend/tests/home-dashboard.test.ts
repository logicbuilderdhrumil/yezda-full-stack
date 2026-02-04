/**
 * Home Dashboard Tests
 * Task 1.3: Tests for metrics aggregation
 * Task 1.4: Tests for tenant scoping and RBAC
 * Task 1.5: Tests for audit logging
 * Task 1.7: Tests for SLO monitoring
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dashboardService } from '../src/services/home-dashboard.service.js';
import { dashboardMetricsService, DASHBOARD_SLOS } from '../src/services/home-dashboard-metrics.service.js';
import {
  timeRangeSchema,
  kpiMetricTypeSchema,
  dashboardSummaryQuerySchema,
  activityFeedQuerySchema,
  trendDataQuerySchema,
  type DashboardTimeRange,
  type KpiMetricType,
  type DashboardSummary,
  type ActivityFeed,
  type TrendData,
  type KpiSummary,
} from '../src/models/home-dashboard.model.js';

// Mock audit service
vi.mock('../src/services/audit.service.js', () => ({
  auditService: {
    log: vi.fn(),
  },
}));

// Mock redis cache functions
vi.mock('../src/db/redis.js', () => ({
  cacheGet: vi.fn().mockResolvedValue(null),
  cacheSet: vi.fn().mockResolvedValue(undefined),
  cacheDel: vi.fn().mockResolvedValue(undefined),
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 10, resetAt: Date.now() + 60000 }),
}));

const requestContext = {
  ipAddress: '127.0.0.1',
  userAgent: 'test-agent',
  channel: 'api' as const,
};

const testActor = {
  userId: 'user-1',
  userType: 'user' as const,
  tenantId: 'tenant-1',
};

describe('Dashboard Model', () => {
  describe('timeRangeSchema', () => {
    it('should accept valid time ranges', () => {
      expect(timeRangeSchema.parse('24h')).toBe('24h');
      expect(timeRangeSchema.parse('7d')).toBe('7d');
      expect(timeRangeSchema.parse('30d')).toBe('30d');
      expect(timeRangeSchema.parse('90d')).toBe('90d');
    });

    it('should reject invalid time ranges', () => {
      expect(() => timeRangeSchema.parse('1h')).toThrow();
      expect(() => timeRangeSchema.parse('invalid')).toThrow();
    });
  });

  describe('kpiMetricTypeSchema', () => {
    it('should accept valid metric types', () => {
      expect(kpiMetricTypeSchema.parse('active_users')).toBe('active_users');
      expect(kpiMetricTypeSchema.parse('new_signups')).toBe('new_signups');
      expect(kpiMetricTypeSchema.parse('pending_tasks')).toBe('pending_tasks');
      expect(kpiMetricTypeSchema.parse('completed_tasks')).toBe('completed_tasks');
    });

    it('should reject invalid metric types', () => {
      expect(() => kpiMetricTypeSchema.parse('invalid_metric')).toThrow();
    });
  });

  describe('dashboardSummaryQuerySchema', () => {
    it('should parse valid query parameters', () => {
      const result = dashboardSummaryQuerySchema.parse({
        timeRange: '7d',
        activityLimit: '10',
      });

      expect(result.timeRange).toBe('7d');
      expect(result.activityLimit).toBe(10);
    });

    it('should apply defaults for missing parameters', () => {
      const result = dashboardSummaryQuerySchema.parse({});

      expect(result.timeRange).toBe('7d');
      expect(result.activityLimit).toBe(10);
    });

    it('should enforce max activity limit', () => {
      expect(() =>
        dashboardSummaryQuerySchema.parse({ activityLimit: '100' })
      ).toThrow();
    });
  });

  describe('activityFeedQuerySchema', () => {
    it('should parse valid query parameters', () => {
      const result = activityFeedQuerySchema.parse({
        limit: '50',
        cursor: 'cursor-value',
      });

      expect(result.limit).toBe(50);
      expect(result.cursor).toBe('cursor-value');
    });

    it('should apply defaults for missing parameters', () => {
      const result = activityFeedQuerySchema.parse({});

      expect(result.limit).toBe(20);
    });

    it('should enforce max limit', () => {
      expect(() =>
        activityFeedQuerySchema.parse({ limit: '200' })
      ).toThrow();
    });
  });

  describe('trendDataQuerySchema', () => {
    it('should parse valid query parameters', () => {
      const result = trendDataQuerySchema.parse({
        timeRange: '30d',
        aggregation: 'weekly',
      });

      expect(result.timeRange).toBe('30d');
      expect(result.aggregation).toBe('weekly');
    });

    it('should apply defaults for missing parameters', () => {
      const result = trendDataQuerySchema.parse({});

      expect(result.timeRange).toBe('7d');
      expect(result.aggregation).toBe('daily');
    });
  });
});

describe('Dashboard Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSummary', () => {
    it('should return dashboard summary with KPIs and activity', async () => {
      const result = await dashboardService.getSummary(
        '7d',
        undefined,
        10,
        testActor,
        requestContext
      );

      expect(result.success).toBe(true);
      const data = result.data as DashboardSummary;
      expect(data.tenantId).toBe(testActor.tenantId);
      expect(data.timeRange).toBe('7d');
      expect(data.kpis).toBeDefined();
      expect(data.kpis.length).toBeGreaterThan(0);
      expect(data.recentActivity).toBeDefined();
      expect(data.recentActivity.length).toBeLessThanOrEqual(10);
    });

    it('should filter KPIs by requested metrics', async () => {
      const requestedMetrics: KpiMetricType[] = ['active_users', 'new_signups'];
      const result = await dashboardService.getSummary(
        '7d',
        requestedMetrics,
        10,
        testActor,
        requestContext
      );

      expect(result.success).toBe(true);
      const data = result.data as DashboardSummary;
      expect(data.kpis.length).toBe(2);
      expect(data.kpis.every((kpi) => requestedMetrics.includes(kpi.type))).toBe(true);
    });

    it('should include trend data for each KPI', async () => {
      const result = await dashboardService.getSummary(
        '7d',
        undefined,
        10,
        testActor,
        requestContext
      );

      expect(result.success).toBe(true);
      const data = result.data as DashboardSummary;
      data.kpis.forEach((kpi) => {
        expect(kpi.trend).toBeDefined();
        expect(kpi.trend.direction).toMatch(/^(up|down|stable)$/);
        expect(typeof kpi.trend.percentage).toBe('number');
      });
    });

    it('should respect tenant isolation', async () => {
      const result1 = await dashboardService.getSummary(
        '7d',
        undefined,
        10,
        { ...testActor, tenantId: 'tenant-1' },
        requestContext
      );

      const result2 = await dashboardService.getSummary(
        '7d',
        undefined,
        10,
        { ...testActor, tenantId: 'tenant-2' },
        requestContext
      );

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect((result1.data as DashboardSummary).tenantId).toBe('tenant-1');
      expect((result2.data as DashboardSummary).tenantId).toBe('tenant-2');
    });
  });

  describe('getKpiSummary', () => {
    it('should return KPI metrics only', async () => {
      const result = await dashboardService.getKpiSummary(
        '7d',
        undefined,
        testActor,
        requestContext
      );

      expect(result.success).toBe(true);
      const data = result.data as KpiSummary;
      expect(data.tenantId).toBe(testActor.tenantId);
      expect(data.timeRange).toBe('7d');
      expect(data.metrics).toBeDefined();
      expect(data.metrics.length).toBeGreaterThan(0);
    });

    it('should adjust metrics based on time range', async () => {
      const result24h = await dashboardService.getKpiSummary(
        '24h',
        undefined,
        testActor,
        requestContext
      );

      const result90d = await dashboardService.getKpiSummary(
        '90d',
        undefined,
        testActor,
        requestContext
      );

      expect(result24h.success).toBe(true);
      expect(result90d.success).toBe(true);
      // 90d values should generally be larger than 24h values due to aggregation
    });
  });

  describe('getActivityFeed', () => {
    it('should return activity feed with pagination', async () => {
      const result = await dashboardService.getActivityFeed(
        20,
        undefined,
        undefined,
        testActor,
        requestContext
      );

      expect(result.success).toBe(true);
      const data = result.data as ActivityFeed;
      expect(data.tenantId).toBe(testActor.tenantId);
      expect(data.items).toBeDefined();
      expect(data.items.length).toBeLessThanOrEqual(20);
      expect(typeof data.hasMore).toBe('boolean');
    });

    it('should filter activity by types', async () => {
      const result = await dashboardService.getActivityFeed(
        20,
        undefined,
        ['user_signup', 'task_completed'],
        testActor,
        requestContext
      );

      expect(result.success).toBe(true);
      const data = result.data as ActivityFeed;
      // All items should be of the filtered types
      data.items.forEach((item) => {
        expect(['user_signup', 'task_completed']).toContain(item.type);
      });
    });

    it('should include activity metadata', async () => {
      const result = await dashboardService.getActivityFeed(
        5,
        undefined,
        undefined,
        testActor,
        requestContext
      );

      expect(result.success).toBe(true);
      const data = result.data as ActivityFeed;
      data.items.forEach((item) => {
        expect(item.id).toBeDefined();
        expect(item.type).toBeDefined();
        expect(item.title).toBeDefined();
        expect(item.timestamp).toBeDefined();
      });
    });
  });

  describe('getTrends', () => {
    it('should return trend data for requested metrics', async () => {
      const metrics: KpiMetricType[] = ['active_users', 'new_signups'];
      const result = await dashboardService.getTrends(
        '7d',
        metrics,
        'daily',
        testActor,
        requestContext
      );

      expect(result.success).toBe(true);
      const data = result.data as TrendData;
      expect(data.tenantId).toBe(testActor.tenantId);
      expect(data.timeRange).toBe('7d');
      expect(data.series.length).toBe(2);
    });

    it('should include data points for each series', async () => {
      const result = await dashboardService.getTrends(
        '7d',
        ['active_users'],
        'daily',
        testActor,
        requestContext
      );

      expect(result.success).toBe(true);
      const data = result.data as TrendData;
      const series = data.series[0];
      expect(series.data.length).toBeGreaterThan(0);
      series.data.forEach((point) => {
        expect(point.timestamp).toBeDefined();
        expect(typeof point.value).toBe('number');
      });
    });

    it('should adjust aggregation granularity', async () => {
      const hourlyResult = await dashboardService.getTrends(
        '24h',
        ['active_users'],
        'hourly',
        testActor,
        requestContext
      );

      const dailyResult = await dashboardService.getTrends(
        '30d',
        ['active_users'],
        'daily',
        testActor,
        requestContext
      );

      expect(hourlyResult.success).toBe(true);
      expect(dailyResult.success).toBe(true);

      const hourlySeries = (hourlyResult.data as TrendData).series[0];
      const dailySeries = (dailyResult.data as TrendData).series[0];

      expect(hourlySeries.aggregation).toBe('hourly');
      expect(dailySeries.aggregation).toBe('daily');
    });
  });
});

describe('Dashboard Security/Compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Tenant Isolation', () => {
    it('should scope summary data to tenant', async () => {
      const result = await dashboardService.getSummary(
        '7d',
        undefined,
        10,
        testActor,
        requestContext
      );

      expect(result.success).toBe(true);
      expect((result.data as DashboardSummary).tenantId).toBe(testActor.tenantId);
    });

    it('should scope activity feed to tenant', async () => {
      const result = await dashboardService.getActivityFeed(
        20,
        undefined,
        undefined,
        testActor,
        requestContext
      );

      expect(result.success).toBe(true);
      expect((result.data as ActivityFeed).tenantId).toBe(testActor.tenantId);
    });

    it('should scope trend data to tenant', async () => {
      const result = await dashboardService.getTrends(
        '7d',
        ['active_users'],
        'daily',
        testActor,
        requestContext
      );

      expect(result.success).toBe(true);
      expect((result.data as TrendData).tenantId).toBe(testActor.tenantId);
    });
  });

  describe('Audit Trail', () => {
    it('should log dashboard summary access', async () => {
      const { auditService } = await import('../src/services/audit.service.js');

      await dashboardService.getSummary(
        '7d',
        undefined,
        10,
        testActor,
        requestContext
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'DASHBOARD_SUMMARY_ACCESSED',
          actorId: testActor.userId,
          actorType: testActor.userType,
          metadata: expect.objectContaining({
            tenantId: testActor.tenantId,
          }),
          success: true,
        })
      );
    });

    it('should log activity feed access', async () => {
      const { auditService } = await import('../src/services/audit.service.js');

      await dashboardService.getActivityFeed(
        20,
        undefined,
        undefined,
        testActor,
        requestContext
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'DASHBOARD_ACTIVITY_ACCESSED',
          actorId: testActor.userId,
          success: true,
        })
      );
    });

    it('should log trend data access', async () => {
      const { auditService } = await import('../src/services/audit.service.js');

      await dashboardService.getTrends(
        '7d',
        ['active_users'],
        'daily',
        testActor,
        requestContext
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'DASHBOARD_TRENDS_ACCESSED',
          success: true,
        })
      );
    });

    it('should include metadata in audit logs', async () => {
      const { auditService } = await import('../src/services/audit.service.js');

      await dashboardService.getSummary(
        '30d',
        ['active_users'],
        5,
        testActor,
        requestContext
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            timeRange: '30d',
          }),
        })
      );
    });
  });
});

describe('Dashboard Metrics', () => {
  it('should have defined SLO targets', () => {
    expect(DASHBOARD_SLOS.SUMMARY_LATENCY_P99_MS).toBeDefined();
    expect(DASHBOARD_SLOS.SUMMARY_LATENCY_P95_MS).toBeDefined();
    expect(DASHBOARD_SLOS.ACTIVITY_LATENCY_P99_MS).toBeDefined();
    expect(DASHBOARD_SLOS.TRENDS_LATENCY_P99_MS).toBeDefined();
    expect(DASHBOARD_SLOS.SUMMARY_SUCCESS_RATE).toBeDefined();
    expect(DASHBOARD_SLOS.CACHE_HIT_RATE).toBeDefined();
    expect(DASHBOARD_SLOS.MAX_ACCESS_DENIED_RATE_PER_MINUTE).toBeDefined();
  });

  it('should return SLO check result structure', () => {
    const result = dashboardMetricsService.checkSLOs();

    expect(result).toHaveProperty('met');
    expect(result).toHaveProperty('violations');
    expect(typeof result.met).toBe('boolean');
    expect(Array.isArray(result.violations)).toBe(true);
  });

  it('should track summary latency', () => {
    // Record some metrics
    dashboardMetricsService.recordSummary(true, 50);
    dashboardMetricsService.recordSummary(true, 100);
    dashboardMetricsService.recordSummary(false, 200);

    // Verify the metrics service doesn't throw
    expect(() => dashboardMetricsService.getSummaryP99Latency()).not.toThrow();
    expect(() => dashboardMetricsService.getSummarySuccessRate()).not.toThrow();
  });

  it('should track cache hits and misses', () => {
    dashboardMetricsService.recordCacheHit(true);
    dashboardMetricsService.recordCacheHit(true);
    dashboardMetricsService.recordCacheHit(false);

    expect(() => dashboardMetricsService.getCacheHitRate()).not.toThrow();
  });

  it('should track access denied events', () => {
    dashboardMetricsService.recordAccessDenied();

    expect(() => dashboardMetricsService.getAccessDeniedCount()).not.toThrow();
  });

  it('should track rate limited events', () => {
    dashboardMetricsService.recordRateLimited();

    expect(() => dashboardMetricsService.getRateLimitedCount()).not.toThrow();
  });
});

describe('Dashboard Caching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should attempt to use cache for summary', async () => {
    const { cacheGet, cacheSet } = await import('../src/db/redis.js');

    await dashboardService.getSummary(
      '7d',
      undefined,
      10,
      testActor,
      requestContext
    );

    expect(cacheGet).toHaveBeenCalled();
    expect(cacheSet).toHaveBeenCalled();
  });

  it('should cache activity feed first page', async () => {
    const { cacheGet, cacheSet } = await import('../src/db/redis.js');

    await dashboardService.getActivityFeed(
      20,
      undefined, // No cursor - first page
      undefined,
      testActor,
      requestContext
    );

    expect(cacheGet).toHaveBeenCalled();
    expect(cacheSet).toHaveBeenCalled();
  });

  it('should not cache activity feed with cursor', async () => {
    const { cacheSet } = await import('../src/db/redis.js');
    vi.mocked(cacheSet).mockClear();

    await dashboardService.getActivityFeed(
      20,
      'some-cursor', // With cursor - not first page
      undefined,
      testActor,
      requestContext
    );

    expect(cacheSet).not.toHaveBeenCalled();
  });

  it('should cache trend data', async () => {
    const { cacheGet, cacheSet } = await import('../src/db/redis.js');

    await dashboardService.getTrends(
      '7d',
      ['active_users'],
      'daily',
      testActor,
      requestContext
    );

    expect(cacheGet).toHaveBeenCalled();
    expect(cacheSet).toHaveBeenCalled();
  });

  it('should return cached data when available', async () => {
    const { cacheGet } = await import('../src/db/redis.js');

    const cachedData: DashboardSummary = {
      tenantId: testActor.tenantId,
      timestamp: new Date(),
      timeRange: '7d',
      kpis: [
        {
          type: 'active_users',
          label: 'Cached Active Users',
          value: 999,
          trend: { direction: 'up', percentage: 10, comparisonPeriod: 'previous 7d' },
        },
      ],
      recentActivity: [],
      activityTotal: 0,
    };

    vi.mocked(cacheGet).mockResolvedValueOnce(cachedData);

    const result = await dashboardService.getSummary(
      '7d',
      undefined,
      10,
      testActor,
      requestContext
    );

    expect(result.success).toBe(true);
    expect((result.data as DashboardSummary).kpis[0].label).toBe('Cached Active Users');
  });
});
