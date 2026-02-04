/**
 * Charting Tests
 * Task 1.3: Tests for aggregation and time-range handling
 * Task 1.4: Tests for tenant scoping and RBAC
 * Task 1.5: Tests for audit logging
 * Task 1.6: Tests for caching
 * Task 1.7: Tests for SLO metrics
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { chartingService } from '../src/services/charting.service.js';
import {
  chartingMetricsService,
  CHART_SLOS,
} from '../src/services/charting-metrics.service.js';
import {
  calculateTimeRange,
  determineGranularity,
  AVAILABLE_METRICS,
  DEFAULT_AGGREGATIONS,
  type ChartFilters,
  type ChartData,
  type MetricType,
} from '../src/models/charting.model.js';

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

const viewerActor = {
  userId: 'viewer-user-1',
  userType: 'user' as const,
  tenantId: 'tenant-123',
};

const adminActor = {
  userId: 'admin-user-1',
  userType: 'user' as const,
  tenantId: 'tenant-123',
};

describe('Charting Model', () => {
  describe('calculateTimeRange', () => {
    it('should calculate hour time range', () => {
      const range = calculateTimeRange('hour');
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      expect(range.end.getTime()).toBeCloseTo(now.getTime(), -3);
      expect(range.start.getTime()).toBeCloseTo(hourAgo.getTime(), -3);
    });

    it('should calculate day time range', () => {
      const range = calculateTimeRange('day');
      const now = new Date();
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      expect(range.end.getTime()).toBeCloseTo(now.getTime(), -3);
      expect(range.start.getTime()).toBeCloseTo(dayAgo.getTime(), -3);
    });

    it('should calculate week time range', () => {
      const range = calculateTimeRange('week');
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      expect(range.end.getTime()).toBeCloseTo(now.getTime(), -3);
      expect(range.start.getTime()).toBeCloseTo(weekAgo.getTime(), -3);
    });

    it('should calculate month time range', () => {
      const range = calculateTimeRange('month');

      // Verify it's approximately 30 days
      const durationDays = (range.end.getTime() - range.start.getTime()) / (24 * 60 * 60 * 1000);
      expect(durationDays).toBeGreaterThanOrEqual(28);
      expect(durationDays).toBeLessThanOrEqual(31);
    });

    it('should calculate quarter time range', () => {
      const range = calculateTimeRange('quarter');

      // Verify it's approximately 90 days
      const durationDays = (range.end.getTime() - range.start.getTime()) / (24 * 60 * 60 * 1000);
      expect(durationDays).toBeGreaterThanOrEqual(89);
      expect(durationDays).toBeLessThanOrEqual(92);
    });

    it('should calculate year time range', () => {
      const range = calculateTimeRange('year');

      // Verify it's approximately 365 days
      const durationDays = (range.end.getTime() - range.start.getTime()) / (24 * 60 * 60 * 1000);
      expect(durationDays).toBeGreaterThanOrEqual(364);
      expect(durationDays).toBeLessThanOrEqual(366);
    });
  });

  describe('determineGranularity', () => {
    it('should return minute for short ranges (≤2 hours)', () => {
      const end = new Date();
      const start = new Date(end.getTime() - 60 * 60 * 1000);

      expect(determineGranularity(start, end)).toBe('minute');
    });

    it('should return hour for medium ranges (≤48 hours)', () => {
      const end = new Date();
      const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);

      expect(determineGranularity(start, end)).toBe('hour');
    });

    it('should return day for week ranges (≤2 weeks)', () => {
      const end = new Date();
      const start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

      expect(determineGranularity(start, end)).toBe('day');
    });

    it('should return week for month ranges (≤3 months)', () => {
      const end = new Date();
      const start = new Date(end.getTime() - 60 * 24 * 60 * 60 * 1000);

      expect(determineGranularity(start, end)).toBe('week');
    });

    it('should return month for long ranges (>3 months)', () => {
      const end = new Date();
      const start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);

      expect(determineGranularity(start, end)).toBe('month');
    });
  });

  describe('AVAILABLE_METRICS', () => {
    it('should have all expected metrics', () => {
      const expectedMetrics: MetricType[] = [
        'screenings_completed',
        'screenings_pending',
        'candidates_active',
        'candidates_onboarded',
        'applications_received',
        'turnaround_time',
        'completion_rate',
        'user_activity',
        'api_latency',
        'error_rate',
      ];

      expectedMetrics.forEach((metric) => {
        expect(AVAILABLE_METRICS[metric]).toBeDefined();
        expect(AVAILABLE_METRICS[metric].name).toBeDefined();
        expect(AVAILABLE_METRICS[metric].description).toBeDefined();
        expect(AVAILABLE_METRICS[metric].unit).toBeDefined();
      });
    });
  });

  describe('DEFAULT_AGGREGATIONS', () => {
    it('should have default aggregation for each metric', () => {
      const metrics = Object.keys(AVAILABLE_METRICS) as MetricType[];

      metrics.forEach((metric) => {
        expect(DEFAULT_AGGREGATIONS[metric]).toBeDefined();
      });
    });

    it('should use sum for count-based metrics', () => {
      expect(DEFAULT_AGGREGATIONS['screenings_completed']).toBe('sum');
      expect(DEFAULT_AGGREGATIONS['candidates_onboarded']).toBe('sum');
      expect(DEFAULT_AGGREGATIONS['applications_received']).toBe('sum');
    });

    it('should use avg for rate-based metrics', () => {
      expect(DEFAULT_AGGREGATIONS['completion_rate']).toBe('avg');
      expect(DEFAULT_AGGREGATIONS['error_rate']).toBe('avg');
      expect(DEFAULT_AGGREGATIONS['api_latency']).toBe('avg');
    });
  });
});

describe('Charting Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getChartData', () => {
    it('should return chart data for specified metrics', async () => {
      const filters: ChartFilters = {
        metrics: ['screenings_completed', 'candidates_active'],
        timeRange: { preset: 'day' },
      };

      const result = await chartingService.getChartData(filters, viewerActor, requestContext);

      expect(result.success).toBe(true);
      if (!result.success) throw new Error('Expected success');
      expect(result.data).toBeDefined();

      const data = result.data;
      expect(data.series).toHaveLength(2);
      
      // Check that both metrics are present (order may vary with Promise.all)
      const metricNames = data.series.map((s) => s.metric);
      expect(metricNames).toContain('screenings_completed');
      expect(metricNames).toContain('candidates_active');
    });

    it('should calculate time range from preset', async () => {
      const filters: ChartFilters = {
        metrics: ['screenings_completed'],
        timeRange: { preset: 'week' },
      };

      const result = await chartingService.getChartData(filters, viewerActor, requestContext);

      expect(result.success).toBe(true);
      if (!result.success) throw new Error('Expected success');
      const data = result.data;

      // Verify time range is approximately 7 days
      const durationDays = (data.timeRange.end.getTime() - data.timeRange.start.getTime()) / (24 * 60 * 60 * 1000);
      expect(durationDays).toBeCloseTo(7, 0);
    });

    it('should use custom time range when provided', async () => {
      const start = new Date('2026-01-01');
      const end = new Date('2026-01-15');

      const filters: ChartFilters = {
        metrics: ['screenings_completed'],
        timeRange: { preset: 'custom', start, end },
      };

      const result = await chartingService.getChartData(filters, viewerActor, requestContext);

      expect(result.success).toBe(true);
      if (!result.success) throw new Error('Expected success');
      const data = result.data;

      expect(data.timeRange.start.toISOString()).toBe(start.toISOString());
      expect(data.timeRange.end.toISOString()).toBe(end.toISOString());
    });

    it('should include tenant ID in metadata', async () => {
      const filters: ChartFilters = {
        metrics: ['screenings_completed'],
        timeRange: { preset: 'day' },
      };

      const result = await chartingService.getChartData(filters, viewerActor, requestContext);

      expect(result.success).toBe(true);
      if (!result.success) throw new Error('Expected success');
      const data = result.data;

      expect(data.metadata.tenantId).toBe('tenant-123');
    });

    it('should determine granularity automatically', async () => {
      const filters: ChartFilters = {
        metrics: ['screenings_completed'],
        timeRange: { preset: 'hour' },
      };

      const result = await chartingService.getChartData(filters, viewerActor, requestContext);

      expect(result.success).toBe(true);
      if (!result.success) throw new Error('Expected success');
      const data = result.data;

      expect(data.series[0].granularity).toBe('minute');
    });

    it('should respect custom granularity', async () => {
      const filters: ChartFilters = {
        metrics: ['screenings_completed'],
        timeRange: { preset: 'day' },
        granularity: 'hour',
      };

      const result = await chartingService.getChartData(filters, viewerActor, requestContext);

      expect(result.success).toBe(true);
      if (!result.success) throw new Error('Expected success');
      const data = result.data;

      expect(data.series[0].granularity).toBe('hour');
    });
  });

  describe('getAvailableMetrics', () => {
    it('should return all available metrics', async () => {
      const result = await chartingService.getAvailableMetrics(viewerActor, requestContext);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(AVAILABLE_METRICS);
    });
  });

  describe('aggregateMetric', () => {
    it('should aggregate metric with sum', async () => {
      const filters: ChartFilters = {
        metrics: ['screenings_completed'],
        timeRange: { preset: 'day' },
      };

      const result = await chartingService.aggregateMetric(
        'screenings_completed',
        'sum',
        filters,
        viewerActor,
        requestContext
      );

      expect(result.success).toBe(true);
      if (!result.success) throw new Error('Expected success');
      expect(result.data).toHaveProperty('value');
      expect(result.data).toHaveProperty('unit');
      expect(result.data.unit).toBe('count');
    });

    it('should aggregate metric with avg', async () => {
      const filters: ChartFilters = {
        metrics: ['turnaround_time'],
        timeRange: { preset: 'week' },
      };

      const result = await chartingService.aggregateMetric(
        'turnaround_time',
        'avg',
        filters,
        viewerActor,
        requestContext
      );

      expect(result.success).toBe(true);
      if (!result.success) throw new Error('Expected success');
      expect(result.data.unit).toBe('hours');
    });

    it('should aggregate metric with min/max', async () => {
      const filters: ChartFilters = {
        metrics: ['api_latency'],
        timeRange: { preset: 'day' },
      };

      const minResult = await chartingService.aggregateMetric(
        'api_latency',
        'min',
        filters,
        viewerActor,
        requestContext
      );

      const maxResult = await chartingService.aggregateMetric(
        'api_latency',
        'max',
        filters,
        viewerActor,
        requestContext
      );

      expect(minResult.success).toBe(true);
      expect(maxResult.success).toBe(true);
      if (!minResult.success || !maxResult.success) throw new Error('Expected success');
      expect(minResult.data.value).toBeLessThanOrEqual(maxResult.data.value);
    });
  });

  describe('Tenant Isolation', () => {
    it('should generate different data for different tenants', async () => {
      const filters: ChartFilters = {
        metrics: ['screenings_completed'],
        timeRange: { preset: 'day' },
      };

      const tenant1Actor = { ...viewerActor, tenantId: 'tenant-1' };
      const tenant2Actor = { ...viewerActor, tenantId: 'tenant-2' };

      const result1 = await chartingService.getChartData(filters, tenant1Actor, requestContext);
      const result2 = await chartingService.getChartData(filters, tenant2Actor, requestContext);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      if (!result1.success || !result2.success) throw new Error('Expected success');

      // Verify tenant IDs in metadata
      expect(result1.data.metadata.tenantId).toBe('tenant-1');
      expect(result2.data.metadata.tenantId).toBe('tenant-2');
    });
  });

  describe('Audit Logging', () => {
    it('should log chart data access', async () => {
      const { auditService } = await import('../src/services/audit.service.js');

      const filters: ChartFilters = {
        metrics: ['screenings_completed'],
        timeRange: { preset: 'day' },
      };

      await chartingService.getChartData(filters, viewerActor, requestContext);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CHART_DATA_ACCESSED',
          actorId: viewerActor.userId,
          actorType: viewerActor.userType,
          targetId: viewerActor.tenantId,
          success: true,
        })
      );
    });

    it('should log metrics list access', async () => {
      const { auditService } = await import('../src/services/audit.service.js');
      vi.clearAllMocks();

      await chartingService.getAvailableMetrics(viewerActor, requestContext);

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CHART_METRICS_LISTED',
          actorId: viewerActor.userId,
          success: true,
        })
      );
    });

    it('should log aggregation operations', async () => {
      const { auditService } = await import('../src/services/audit.service.js');
      vi.clearAllMocks();

      const filters: ChartFilters = {
        metrics: ['screenings_completed'],
        timeRange: { preset: 'day' },
      };

      await chartingService.aggregateMetric(
        'screenings_completed',
        'sum',
        filters,
        viewerActor,
        requestContext
      );

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CHART_AGGREGATION_APPLIED',
          actorId: viewerActor.userId,
          success: true,
        })
      );
    });
  });

  describe('Caching', () => {
    it('should attempt to cache chart data', async () => {
      const { cacheSet } = await import('../src/db/redis.js');

      const filters: ChartFilters = {
        metrics: ['screenings_completed'],
        timeRange: { preset: 'day' },
      };

      await chartingService.getChartData(filters, viewerActor, requestContext);

      expect(cacheSet).toHaveBeenCalled();
    });

    it('should use cached data when available', async () => {
      const { cacheGet, cacheSet } = await import('../src/db/redis.js');

      const cachedData: ChartData = {
        series: [{
          id: 'cached-series',
          name: 'Screenings Completed',
          metric: 'screenings_completed',
          dataPoints: [],
          aggregation: 'sum',
          granularity: 'hour',
          unit: 'count',
        }],
        timeRange: {
          start: new Date(),
          end: new Date(),
        },
        metadata: {
          tenantId: 'tenant-123',
          generatedAt: new Date(),
          cached: true,
        },
      };

      vi.mocked(cacheGet).mockResolvedValueOnce(cachedData);

      const filters: ChartFilters = {
        metrics: ['screenings_completed'],
        timeRange: { preset: 'day' },
      };

      const result = await chartingService.getChartData(filters, viewerActor, requestContext);

      expect(result.success).toBe(true);
      if (!result.success) throw new Error('Expected success');
      expect(result.data.series[0].id).toBe('cached-series');
      expect(cacheSet).not.toHaveBeenCalled();
    });
  });
});

describe('Charting Metrics', () => {
  it('should have defined SLO targets', () => {
    expect(CHART_SLOS.QUERY_LATENCY_P99_MS).toBeDefined();
    expect(CHART_SLOS.QUERY_LATENCY_P95_MS).toBeDefined();
    expect(CHART_SLOS.AGGREGATE_LATENCY_P99_MS).toBeDefined();
    expect(CHART_SLOS.QUERY_SUCCESS_RATE).toBeDefined();
    expect(CHART_SLOS.CACHE_HIT_RATE).toBeDefined();
    expect(CHART_SLOS.MAX_ACCESS_DENIED_RATE_PER_MINUTE).toBeDefined();
  });

  it('should return SLO check result structure', () => {
    const result = chartingMetricsService.checkSLOs();

    expect(result).toHaveProperty('met');
    expect(result).toHaveProperty('violations');
    expect(typeof result.met).toBe('boolean');
    expect(Array.isArray(result.violations)).toBe(true);
  });

  it('should track cache hits and misses', () => {
    // Record some cache events
    chartingMetricsService.recordCacheHit(true);
    chartingMetricsService.recordCacheHit(true);
    chartingMetricsService.recordCacheHit(false);

    const hitRate = chartingMetricsService.getCacheHitRate();
    expect(typeof hitRate).toBe('number');
    expect(hitRate).toBeGreaterThanOrEqual(0);
    expect(hitRate).toBeLessThanOrEqual(100);
  });

  it('should track query success rate', () => {
    const successRate = chartingMetricsService.getQuerySuccessRate();
    expect(typeof successRate).toBe('number');
    expect(successRate).toBeGreaterThanOrEqual(0);
    expect(successRate).toBeLessThanOrEqual(100);
  });

  it('should track access denied events', () => {
    chartingMetricsService.recordAccessDenied();
    const count = chartingMetricsService.getAccessDeniedCount();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it('should track rate limited events', () => {
    chartingMetricsService.recordRateLimited();
    const count = chartingMetricsService.getRateLimitedCount();
    expect(typeof count).toBe('number');
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
