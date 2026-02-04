/**
 * Charting Controller
 * Task 1.2: Chart endpoint handlers
 * Task 1.4: RBAC and tenant isolation in handlers
 */

import type { Request, Response } from 'express';
import { chartingService } from '../services/charting.service.js';
import { chartingMetricsService } from '../services/charting-metrics.service.js';
import type { AuthenticatedRoleRequest } from '../middleware/route-guards.middleware.js';
import type {
  ChartFilters,
  MetricType,
  AggregationType,
  TimeRangePreset,
  Granularity,
} from '../models/charting.model.js';

/**
 * Get client info from request for audit logging
 */
function getClientInfo(req: Request) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    channel: (req.get('x-channel') || 'api') as 'web' | 'mobile' | 'api',
  };
}

/**
 * Extract actor context from authenticated request
 */
function getActorContext(req: AuthenticatedRoleRequest) {
  return {
    userId: req.user?.sub ?? 'unknown',
    userType: (req.user?.type ?? 'user') as 'user' | 'candidate',
    tenantId: req.user?.tenantId ?? 'default',
  };
}

/**
 * POST /api/v1/charts/query
 * Get chart data for specified metrics
 */
export async function queryChartData(
  req: AuthenticatedRoleRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const actor = getActorContext(req);
  const requestContext = getClientInfo(req);

  // Parse filters from request body
  const filters: ChartFilters = {
    metrics: req.body.metrics as MetricType[],
    timeRange: {
      preset: req.body.timeRange?.preset as TimeRangePreset | undefined,
      start: req.body.timeRange?.start ? new Date(req.body.timeRange.start) : undefined,
      end: req.body.timeRange?.end ? new Date(req.body.timeRange.end) : undefined,
    },
    granularity: req.body.granularity as Granularity | undefined,
    aggregation: req.body.aggregation as AggregationType | undefined,
    groupBy: req.body.groupBy,
  };

  const result = await chartingService.getChartData(filters, actor, requestContext);

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/charts/metrics
 * Get available metrics for charting
 */
export async function getAvailableMetrics(
  req: AuthenticatedRoleRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const actor = getActorContext(req);
  const requestContext = getClientInfo(req);

  const result = await chartingService.getAvailableMetrics(actor, requestContext);

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * POST /api/v1/charts/aggregate
 * Aggregate metric data for a specific time range
 */
export async function aggregateMetric(
  req: AuthenticatedRoleRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const actor = getActorContext(req);
  const requestContext = getClientInfo(req);

  const metric = req.body.metric as MetricType;
  const aggregation = req.body.aggregation as AggregationType;
  const filters: ChartFilters = {
    metrics: [metric],
    timeRange: {
      preset: req.body.timeRange?.preset as TimeRangePreset | undefined,
      start: req.body.timeRange?.start ? new Date(req.body.timeRange.start) : undefined,
      end: req.body.timeRange?.end ? new Date(req.body.timeRange.end) : undefined,
    },
  };

  const result = await chartingService.aggregateMetric(
    metric,
    aggregation,
    filters,
    actor,
    requestContext
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/charts/health
 * Get charting service health and SLO status
 */
export async function getChartingHealth(
  req: AuthenticatedRoleRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const sloStatus = chartingMetricsService.checkSLOs();

  res.status(200).json({
    status: sloStatus.met ? 'healthy' : 'degraded',
    slos: sloStatus,
    metrics: {
      querySuccessRate: chartingMetricsService.getQuerySuccessRate(),
      queryP99Latency: chartingMetricsService.getQueryP99Latency(),
      aggregateP99Latency: chartingMetricsService.getAggregateP99Latency(),
      cacheHitRate: chartingMetricsService.getCacheHitRate(),
      accessDeniedCount: chartingMetricsService.getAccessDeniedCount(),
      rateLimitedCount: chartingMetricsService.getRateLimitedCount(),
    },
  });
}
