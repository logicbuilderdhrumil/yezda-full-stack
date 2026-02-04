/**
 * Shared Widgets Controller
 * Tasks 1.2, 1.3, 1.5: Widget data endpoint handlers with RBAC
 */

import type { Request, Response } from 'express';
import { sharedWidgetsService } from '../services/shared-widgets.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import type { AvailableWidget } from '../models/shared-widgets.model.js';

/**
 * Extract client info from request
 */
function getClientInfo(req: Request) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    channel: (req.get('x-channel') || 'api') as 'web' | 'mobile' | 'api',
  };
}

/**
 * Extract tenant ID from authenticated user or header
 * Task 1.5: Tenant scoping
 */
function getTenantId(req: AuthenticatedRequest): string {
  // Try header first (for multi-tenant scenarios)
  const headerTenantId = req.get('x-tenant-id');
  if (headerTenantId) {
    return headerTenantId;
  }

  // Default tenant for single-tenant or testing
  return 'default';
}

/**
 * GET /api/v1/widgets/tables/:widgetId
 * Get table data with pagination and sorting
 * Task 1.2: Table data endpoints
 */
export async function getTableData(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { ipAddress } = getClientInfo(req);
  const tenantId = getTenantId(req);
  const widgetId = req.params.widgetId as AvailableWidget;

  // Extract pagination and sorting params
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20;
  const sortColumn = req.query.sortColumn as string | undefined;
  const sortDirection = req.query.sortDirection as 'asc' | 'desc' | undefined;

  // Get auth info if present
  const userId = req.user?.sub;
  const userType = req.user?.type;

  // Task 1.5: Validate tenant access if authenticated
  if (userId && userType) {
    const userTenantId = req.get('x-user-tenant-id') || 'default';
    const accessCheck = sharedWidgetsService.validateTenantAccess(
      tenantId,
      userTenantId,
      widgetId,
      userId,
      userType,
      ipAddress
    );

    if (!accessCheck.allowed) {
      res.status(403).json({ error: accessCheck.error, code: 'TENANT_ACCESS_DENIED' });
      return;
    }
  }

  const result = await sharedWidgetsService.getTableData(
    tenantId,
    widgetId,
    { page, pageSize, sortColumn, sortDirection },
    userId,
    userType,
    ipAddress
  );

  if (!result.success) {
    res.status(400).json({ error: result.error, code: result.errorCode });
    return;
  }

  // Set cache headers
  if (result.cached) {
    res.setHeader('X-Cache', 'HIT');
  } else {
    res.setHeader('X-Cache', 'MISS');
  }
  res.setHeader('Cache-Control', 'private, max-age=300');

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/widgets/visualizations/:widgetId
 * Get visualization data
 * Task 1.3: Visualization data endpoints
 */
export async function getVisualizationData(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { ipAddress } = getClientInfo(req);
  const tenantId = getTenantId(req);
  const widgetId = req.params.widgetId as AvailableWidget;

  // Extract time range params
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  const granularity = (req.query.granularity as 'hour' | 'day' | 'week' | 'month') || 'day';

  // Get auth info if present
  const userId = req.user?.sub;
  const userType = req.user?.type;

  // Task 1.5: Validate tenant access if authenticated
  if (userId && userType) {
    const userTenantId = req.get('x-user-tenant-id') || 'default';
    const accessCheck = sharedWidgetsService.validateTenantAccess(
      tenantId,
      userTenantId,
      widgetId,
      userId,
      userType,
      ipAddress
    );

    if (!accessCheck.allowed) {
      res.status(403).json({ error: accessCheck.error, code: 'TENANT_ACCESS_DENIED' });
      return;
    }
  }

  const result = await sharedWidgetsService.getVisualizationData(
    tenantId,
    widgetId,
    { startDate, endDate, granularity },
    userId,
    userType,
    ipAddress
  );

  if (!result.success) {
    res.status(400).json({ error: result.error, code: result.errorCode });
    return;
  }

  // Set cache headers
  if (result.cached) {
    res.setHeader('X-Cache', 'HIT');
  } else {
    res.setHeader('X-Cache', 'MISS');
  }
  res.setHeader('Cache-Control', 'private, max-age=300');

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/widgets
 * Get list of available widgets
 */
export function getAvailableWidgets(_req: Request, res: Response): void {
  const widgets = sharedWidgetsService.getAvailableWidgets();
  res.status(200).json({ widgets });
}

/**
 * GET /api/v1/widgets/health
 * Health check and SLO status for widget endpoints
 * Task 1.8: SLO monitoring
 */
export function getWidgetsHealth(_req: Request, res: Response): void {
  const sloStatus = sharedWidgetsService.checkSLOs();

  res.status(sloStatus.met ? 200 : 503).json({
    status: sloStatus.met ? 'healthy' : 'degraded',
    slosViolated: sloStatus.violations,
    metrics: {
      availability: sloStatus.availability.toFixed(2) + '%',
      errorRate: sloStatus.errorRate.toFixed(2) + '%',
      latencyP95: sloStatus.latencyP95.toFixed(0) + 'ms',
      cacheHitRate: sloStatus.cacheHitRate.toFixed(2) + '%',
    },
    timestamp: new Date().toISOString(),
  });
}
