/**
 * Home Dashboard Controller
 * Task 1.2: Dashboard endpoint handlers
 * Task 1.4: Enforce tenant scoping in handlers
 * Task 1.5: Record audit events for dashboard access
 */

import type { Response } from 'express';
import { dashboardService } from '../services/home-dashboard.service.js';
import type { AuthenticatedRoleRequest } from '../middleware/route-guards.middleware.js';
import type {
  KpiMetricType,
  ActivityType,
  DashboardTimeRange,
} from '../models/home-dashboard.model.js';

/**
 * Get client info from request for audit logging
 */
function getClientInfo(req: AuthenticatedRoleRequest) {
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
    tenantId: req.user?.tenantId ?? req.get('x-tenant-id') ?? 'default',
  };
}

/**
 * GET /api/v1/dashboard/summary
 * Get dashboard summary with KPIs and recent activity
 */
export async function getDashboardSummary(
  req: AuthenticatedRoleRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const actor = getActorContext(req);
  const requestContext = getClientInfo(req);

  // Parse query parameters
  const timeRange = (req.query.timeRange as DashboardTimeRange) || '7d';
  const activityLimit = req.query.activityLimit
    ? parseInt(req.query.activityLimit as string, 10)
    : 10;

  // Parse metrics filter
  let metrics: KpiMetricType[] | undefined;
  if (req.query.metrics) {
    metrics = (req.query.metrics as string).split(',') as KpiMetricType[];
  }

  const result = await dashboardService.getSummary(
    timeRange,
    metrics,
    activityLimit,
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
 * GET /api/v1/dashboard/kpis
 * Get KPI metrics only
 */
export async function getKpiMetrics(
  req: AuthenticatedRoleRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const actor = getActorContext(req);
  const requestContext = getClientInfo(req);

  // Parse query parameters
  const timeRange = (req.query.timeRange as DashboardTimeRange) || '7d';

  // Parse metrics filter
  let metrics: KpiMetricType[] | undefined;
  if (req.query.metrics) {
    metrics = (req.query.metrics as string).split(',') as KpiMetricType[];
  }

  const result = await dashboardService.getKpiSummary(
    timeRange,
    metrics,
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
 * GET /api/v1/dashboard/activity
 * Get activity feed
 */
export async function getActivityFeed(
  req: AuthenticatedRoleRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const actor = getActorContext(req);
  const requestContext = getClientInfo(req);

  // Parse query parameters
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
  const cursor = req.query.cursor as string | undefined;

  // Parse activity types filter
  let types: ActivityType[] | undefined;
  if (req.query.types) {
    types = (req.query.types as string).split(',') as ActivityType[];
  }

  const result = await dashboardService.getActivityFeed(
    limit,
    cursor,
    types,
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
 * GET /api/v1/dashboard/trends
 * Get trend data for charts
 */
export async function getTrends(
  req: AuthenticatedRoleRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const actor = getActorContext(req);
  const requestContext = getClientInfo(req);

  // Parse query parameters
  const timeRange = (req.query.timeRange as DashboardTimeRange) || '7d';
  const aggregation = (req.query.aggregation as 'hourly' | 'daily' | 'weekly') || 'daily';

  // Parse metrics filter (default to common metrics)
  let metrics: KpiMetricType[] = ['active_users', 'new_signups', 'completed_tasks'];
  if (req.query.metrics) {
    metrics = (req.query.metrics as string).split(',') as KpiMetricType[];
  }

  const result = await dashboardService.getTrends(
    timeRange,
    metrics,
    aggregation,
    actor,
    requestContext
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}
