/**
 * Charting Service
 * Task 1.2: Implement endpoints for chart-ready series data.
 * Task 1.3: Add aggregation and time-range handling.
 * Task 1.4: Enforce tenant scoping for chart endpoints.
 * Task 1.5: Add audit logging for chart data access.
 * Task 1.6: Add caching for chart data endpoints.
 */

import { v4 as uuidv4 } from 'uuid';
import { auditService } from './audit.service.js';
import { chartingMetricsService } from './charting-metrics.service.js';
import { cacheGet, cacheSet } from '../db/redis.js';
import type {
  ChartData,
  ChartSeries,
  ChartDataPoint,
  ChartFilters,
  ChartOperationResult,
  MetricType,
  Granularity,
  AggregationType,
  ChartAuditEventType,
} from '../models/charting.model.js';
import {
  AVAILABLE_METRICS,
  DEFAULT_AGGREGATIONS,
  calculateTimeRange,
  determineGranularity,
} from '../models/charting.model.js';
import type { AuditEventType } from '../models/audit.model.js';

/** Cache TTL in seconds */
const CACHE_TTL_SECONDS = 60; // 1 minute for chart data

/** Request context for audit logging */
interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
  channel: 'web' | 'mobile' | 'api';
}

/** Actor context for audit logging */
interface ActorContext {
  userId: string;
  userType: 'user' | 'candidate';
  tenantId: string;
}

export class ChartingService {
  /**
   * Get chart data for specified metrics
   */
  async getChartData(
    filters: ChartFilters,
    actor: ActorContext,
    requestContext: RequestContext
  ): Promise<ChartOperationResult<ChartData>> {
    const start = Date.now();

    try {
      // Calculate time range
      let timeStart: Date;
      let timeEnd: Date;

      if (filters.timeRange.preset && filters.timeRange.preset !== 'custom') {
        const range = calculateTimeRange(filters.timeRange.preset);
        timeStart = range.start;
        timeEnd = range.end;
      } else if (filters.timeRange.start && filters.timeRange.end) {
        timeStart = new Date(filters.timeRange.start);
        timeEnd = new Date(filters.timeRange.end);
      } else {
        // Default to last 24 hours
        const range = calculateTimeRange('day');
        timeStart = range.start;
        timeEnd = range.end;
      }

      // Determine granularity
      const granularity = filters.granularity || determineGranularity(timeStart, timeEnd);

      // Build cache key
      const cacheKey = this.buildCacheKey(actor.tenantId, filters, timeStart, timeEnd);

      // Try cache first
      const cached = await cacheGet<ChartData>(cacheKey);
      if (cached) {
        chartingMetricsService.recordCacheHit(true);
        chartingMetricsService.recordQuery(true, Date.now() - start);

        this.logChartEvent('CHART_DATA_ACCESSED', {
          actor,
          success: true,
          metadata: {
            metrics: filters.metrics,
            timeRange: { start: timeStart, end: timeEnd },
            cached: true,
          },
          ...requestContext,
        });

        return { success: true, data: cached };
      }

      chartingMetricsService.recordCacheHit(false);

      // Generate chart data for each metric
      const series: ChartSeries[] = await Promise.all(
        filters.metrics.map(async (metric) => {
          return this.generateSeriesData(
            metric,
            actor.tenantId,
            timeStart,
            timeEnd,
            granularity,
            filters.aggregation || DEFAULT_AGGREGATIONS[metric]
          );
        })
      );

      const chartData: ChartData = {
        series,
        timeRange: {
          start: timeStart,
          end: timeEnd,
        },
        metadata: {
          tenantId: actor.tenantId,
          generatedAt: new Date(),
          cached: false,
        },
      };

      // Cache the result
      await cacheSet(cacheKey, chartData, CACHE_TTL_SECONDS * 1000);

      this.logChartEvent('CHART_DATA_ACCESSED', {
        actor,
        success: true,
        metadata: {
          metrics: filters.metrics,
          timeRange: { start: timeStart, end: timeEnd },
          granularity,
          seriesCount: series.length,
        },
        ...requestContext,
      });

      chartingMetricsService.recordQuery(true, Date.now() - start);

      return { success: true, data: chartData };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logChartEvent('CHART_DATA_ACCESSED', {
        actor,
        success: false,
        errorMessage,
        metadata: { metrics: filters.metrics },
        ...requestContext,
      });

      chartingMetricsService.recordQuery(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to retrieve chart data',
        errorCode: 'CHART_QUERY_ERROR',
      };
    }
  }

  /**
   * Get available metrics for charting
   */
  async getAvailableMetrics(
    actor: ActorContext,
    requestContext: RequestContext
  ): Promise<ChartOperationResult<typeof AVAILABLE_METRICS>> {
    const start = Date.now();

    try {
      this.logChartEvent('CHART_METRICS_LISTED', {
        actor,
        success: true,
        ...requestContext,
      });

      chartingMetricsService.recordMetricsList(true, Date.now() - start);

      return { success: true, data: AVAILABLE_METRICS };
    } catch (error) {
      chartingMetricsService.recordMetricsList(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to retrieve available metrics',
        errorCode: 'CHART_METRICS_ERROR',
      };
    }
  }

  /**
   * Aggregate metric data for a specific time range
   */
  async aggregateMetric(
    metric: MetricType,
    aggregation: AggregationType,
    filters: ChartFilters,
    actor: ActorContext,
    requestContext: RequestContext
  ): Promise<ChartOperationResult<{ value: number; unit: string }>> {
    const start = Date.now();

    try {
      // Calculate time range
      let timeStart: Date;
      let timeEnd: Date;

      if (filters.timeRange.preset && filters.timeRange.preset !== 'custom') {
        const range = calculateTimeRange(filters.timeRange.preset);
        timeStart = range.start;
        timeEnd = range.end;
      } else if (filters.timeRange.start && filters.timeRange.end) {
        timeStart = new Date(filters.timeRange.start);
        timeEnd = new Date(filters.timeRange.end);
      } else {
        const range = calculateTimeRange('day');
        timeStart = range.start;
        timeEnd = range.end;
      }

      // Generate mock aggregated value
      const aggregatedValue = this.calculateAggregatedValue(
        metric,
        aggregation,
        actor.tenantId,
        timeStart,
        timeEnd
      );

      this.logChartEvent('CHART_AGGREGATION_APPLIED', {
        actor,
        success: true,
        metadata: {
          metric,
          aggregation,
          timeRange: { start: timeStart, end: timeEnd },
          result: aggregatedValue,
        },
        ...requestContext,
      });

      chartingMetricsService.recordAggregate(true, Date.now() - start);

      return {
        success: true,
        data: {
          value: aggregatedValue,
          unit: AVAILABLE_METRICS[metric].unit,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logChartEvent('CHART_AGGREGATION_APPLIED', {
        actor,
        success: false,
        errorMessage,
        metadata: { metric, aggregation },
        ...requestContext,
      });

      chartingMetricsService.recordAggregate(false, Date.now() - start);

      return {
        success: false,
        error: 'Failed to aggregate metric data',
        errorCode: 'CHART_AGGREGATE_ERROR',
      };
    }
  }

  /**
   * Generate series data for a metric
   */
  private async generateSeriesData(
    metric: MetricType,
    tenantId: string,
    start: Date,
    end: Date,
    granularity: Granularity,
    aggregation: AggregationType
  ): Promise<ChartSeries> {
    const dataPoints = this.generateDataPoints(metric, tenantId, start, end, granularity);
    const metricInfo = AVAILABLE_METRICS[metric];

    return {
      id: uuidv4(),
      name: metricInfo.name,
      metric,
      dataPoints,
      aggregation,
      granularity,
      unit: metricInfo.unit,
    };
  }

  /**
   * Generate data points for a metric (mock data for now)
   * In production, this would query actual data sources
   */
  private generateDataPoints(
    metric: MetricType,
    tenantId: string,
    start: Date,
    end: Date,
    granularity: Granularity
  ): ChartDataPoint[] {
    const dataPoints: ChartDataPoint[] = [];
    const current = new Date(start);
    const intervalMs = this.getIntervalMs(granularity);

    // Generate a seed based on tenantId for consistent mock data
    const seed = tenantId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

    while (current <= end) {
      const baseValue = this.getBaseValue(metric);
      const variation = (Math.sin(current.getTime() / 10000000 + seed) * 0.3 + 0.7);
      const value = Math.round(baseValue * variation * 100) / 100;

      dataPoints.push({
        timestamp: new Date(current),
        value: Math.max(0, value),
      });

      current.setTime(current.getTime() + intervalMs);
    }

    return dataPoints;
  }

  /**
   * Get interval in milliseconds for granularity
   */
  private getIntervalMs(granularity: Granularity): number {
    switch (granularity) {
      case 'minute':
        return 60 * 1000;
      case 'hour':
        return 60 * 60 * 1000;
      case 'day':
        return 24 * 60 * 60 * 1000;
      case 'week':
        return 7 * 24 * 60 * 60 * 1000;
      case 'month':
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return 60 * 60 * 1000;
    }
  }

  /**
   * Get base value for a metric (mock data)
   */
  private getBaseValue(metric: MetricType): number {
    switch (metric) {
      case 'screenings_completed':
        return 45;
      case 'screenings_pending':
        return 12;
      case 'candidates_active':
        return 150;
      case 'candidates_onboarded':
        return 25;
      case 'applications_received':
        return 80;
      case 'turnaround_time':
        return 48;
      case 'completion_rate':
        return 85;
      case 'user_activity':
        return 200;
      case 'api_latency':
        return 120;
      case 'error_rate':
        return 0.5;
      default:
        return 50;
    }
  }

  /**
   * Calculate aggregated value (mock implementation)
   */
  private calculateAggregatedValue(
    metric: MetricType,
    aggregation: AggregationType,
    tenantId: string,
    _start: Date,
    _end: Date
  ): number {
    const baseValue = this.getBaseValue(metric);
    const seed = tenantId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const factor = (seed % 100) / 100 + 0.5;

    switch (aggregation) {
      case 'sum':
        return Math.round(baseValue * factor * 100);
      case 'avg':
        return Math.round(baseValue * factor * 100) / 100;
      case 'min':
        return Math.round(baseValue * factor * 0.5 * 100) / 100;
      case 'max':
        return Math.round(baseValue * factor * 1.5 * 100) / 100;
      case 'count':
        return Math.round(baseValue * 10);
      default:
        return Math.round(baseValue * factor * 100) / 100;
    }
  }

  /**
   * Build cache key for chart data
   */
  private buildCacheKey(
    tenantId: string,
    filters: ChartFilters,
    start: Date,
    end: Date
  ): string {
    const parts = [
      'chart',
      tenantId,
      filters.metrics.sort().join('-'),
      filters.granularity || 'auto',
      filters.aggregation || 'default',
      Math.floor(start.getTime() / 60000).toString(), // Round to minute
      Math.floor(end.getTime() / 60000).toString(),
    ];

    return parts.join(':');
  }

  /**
   * Log chart audit event
   */
  private logChartEvent(
    eventType: ChartAuditEventType,
    params: {
      actor: ActorContext;
      success: boolean;
      errorMessage?: string;
      metadata?: Record<string, unknown>;
      ipAddress?: string;
      userAgent?: string;
      channel: 'web' | 'mobile' | 'api';
    }
  ): void {
    auditService.log({
      eventType: eventType as AuditEventType,
      actorId: params.actor.userId,
      actorType: params.actor.userType,
      targetId: params.actor.tenantId,
      targetType: 'chart',
      channel: params.channel,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: {
        tenantId: params.actor.tenantId,
        ...params.metadata,
      },
      success: params.success,
      errorMessage: params.errorMessage,
    });
  }
}

export const chartingService = new ChartingService();
