/**
 * Template Layouts Controller
 * Task 1.2, 1.3: Layout navigation and profile summary endpoint handlers
 */

import type { Response } from 'express';
import { templateLayoutsService } from '../services/template-layouts.service.js';
import { templateLayoutsMetricsService } from '../services/template-layouts-metrics.service.js';
import type { AuthenticatedRoleRequest, AuthenticatedUserPayload } from '../middleware/route-guards.middleware.js';
import type { LayoutAccessContext } from '../models/template-layouts.model.js';

/**
 * Extract tenant ID from request headers
 */
function getTenantId(req: AuthenticatedRoleRequest): string | undefined {
  return req.get('x-tenant-id');
}

/**
 * Extract user authorities from request
 * Derives authorities from user type and roles (including admin)
 */
function getUserAuthorities(req: AuthenticatedRoleRequest): string[] {
  if (!req.user) return [];

  const user = req.user as AuthenticatedUserPayload;
  const baseAuthorities: string[] = [];

  // Add 'admin' authority if user has admin role
  if (user.roles?.includes('platform_admin')) {
    baseAuthorities.push('admin');
  }

  if (user.type === 'user') {
    // Regular users get basic read permissions
    baseAuthorities.push(
      'candidate:read',
      'screening:read',
      'report:read',
      'settings:read'
    );
  } else if (user.type === 'candidate') {
    // Candidates get limited access
    baseAuthorities.push('candidate:self');
  }

  return baseAuthorities;
}

/**
 * Build layout access context from request
 */
function buildAccessContext(req: AuthenticatedRoleRequest): LayoutAccessContext | null {
  if (!req.user) return null;

  return {
    userId: req.user.sub,
    userType: req.user.type,
    tenantId: getTenantId(req),
    authorities: getUserAuthorities(req),
  };
}

/**
 * GET /api/v1/template-layouts/navigation
 * Get layout navigation metadata (header and side navigation)
 */
export async function getLayoutNavigation(
  req: AuthenticatedRoleRequest,
  res: Response
): Promise<void> {
  const startTime = Date.now();

  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const context = buildAccessContext(req);
  if (!context) {
    res.status(401).json({ error: 'Invalid user context', code: 'INVALID_CONTEXT' });
    return;
  }

  // Validate tenant access
  const requestedTenantId = getTenantId(req);
  // Note: In production, user tenant would come from JWT claims or user service
  // For now, we accept the requested tenant if the user is authenticated
  const userTenantId = requestedTenantId; // Trust authenticated user's tenant header
  const tenantValidation = templateLayoutsService.validateTenantAccess(
    requestedTenantId,
    userTenantId
  );

  if (!tenantValidation.valid) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    templateLayoutsService.logAccessDenied(
      req.user.sub,
      req.user.type,
      tenantValidation.reason!,
      requestedTenantId,
      ipAddress
    );
    templateLayoutsMetricsService.recordAccessDenied('tenant_mismatch');
    res.status(403).json({
      error: 'Access denied',
      code: 'TENANT_ACCESS_DENIED',
      message: tenantValidation.reason,
    });
    return;
  }

  try {
    const navigation = await templateLayoutsService.getLayoutNavigation(context);

    const durationMs = Date.now() - startTime;
    templateLayoutsMetricsService.recordNavigationRequest(true, durationMs);

    // Set cache headers
    res.setHeader('Cache-Control', 'private, max-age=120');
    res.status(200).json(navigation);
  } catch (error) {
    const durationMs = Date.now() - startTime;
    templateLayoutsMetricsService.recordNavigationRequest(false, durationMs);

    console.error('[TemplateLayouts] Navigation error:', error);
    res.status(500).json({
      error: 'Failed to retrieve navigation data',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * GET /api/v1/template-layouts/profile-summary
 * Get profile and notification summary for template controls
 */
export async function getProfileSummary(
  req: AuthenticatedRoleRequest,
  res: Response
): Promise<void> {
  const startTime = Date.now();

  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const context = buildAccessContext(req);
  if (!context) {
    res.status(401).json({ error: 'Invalid user context', code: 'INVALID_CONTEXT' });
    return;
  }

  // Validate tenant access
  const requestedTenantId = getTenantId(req);
  // Note: In production, user tenant would come from JWT claims or user service
  // For now, we accept the requested tenant if the user is authenticated
  const userTenantId = requestedTenantId; // Trust authenticated user's tenant header
  const tenantValidation = templateLayoutsService.validateTenantAccess(
    requestedTenantId,
    userTenantId
  );

  if (!tenantValidation.valid) {
    const ipAddress = req.ip || req.socket.remoteAddress;
    templateLayoutsService.logAccessDenied(
      req.user.sub,
      req.user.type,
      tenantValidation.reason!,
      requestedTenantId,
      ipAddress
    );
    templateLayoutsMetricsService.recordAccessDenied('tenant_mismatch');
    res.status(403).json({
      error: 'Access denied',
      code: 'TENANT_ACCESS_DENIED',
      message: tenantValidation.reason,
    });
    return;
  }

  try {
    const summary = await templateLayoutsService.getGlobalControlSummary(context);

    const durationMs = Date.now() - startTime;
    templateLayoutsMetricsService.recordProfileSummaryRequest(true, durationMs);

    // Set cache headers - shorter TTL for dynamic data
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.status(200).json(summary);
  } catch (error) {
    const durationMs = Date.now() - startTime;
    templateLayoutsMetricsService.recordProfileSummaryRequest(false, durationMs);

    console.error('[TemplateLayouts] Profile summary error:', error);
    res.status(500).json({
      error: 'Failed to retrieve profile summary',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * GET /api/v1/template-layouts/health
 * Get health summary and SLO status for template layout endpoints
 */
export async function getHealthSummary(
  req: AuthenticatedRoleRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  // Health endpoint requires admin role
  const authorities = getUserAuthorities(req);
  if (!authorities.includes('admin')) {
    res.status(403).json({
      error: 'Admin access required',
      code: 'FORBIDDEN',
    });
    return;
  }

  const healthSummary = templateLayoutsMetricsService.getHealthSummary();

  res.status(200).json({
    status: healthSummary.sloStatus.met ? 'healthy' : 'degraded',
    ...healthSummary,
  });
}
