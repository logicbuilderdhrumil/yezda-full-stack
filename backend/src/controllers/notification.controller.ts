/**
 * Notification Controller
 * Task 1.2, 1.3: Notification endpoint handlers
 * Task 1.5: Tenant scoping in handlers
 */

import type { Request, Response } from 'express';
import { notificationService } from '../services/notification.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import type { NotificationFilters, NotificationPaginationOptions } from '../models/notification.model.js';

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
 * Extract tenant ID from authenticated user context.
 * Tenant must come from verified auth claims, never client headers.
 * Uses user ID as tenant for single-tenant/per-user isolation.
 */
function getTenantId(req: AuthenticatedRequest): string {
  // Security: tenant ID derived exclusively from authenticated user context
  return req.user?.sub ?? 'default';
}

/**
 * GET /api/v1/notifications
 * List notifications for the authenticated user
 */
export async function listNotifications(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  const { ipAddress, userAgent, channel } = getClientInfo(req);

  // Parse query parameters for filters and pagination
  const filters: NotificationFilters = {};
  if (req.query.status && (req.query.status === 'read' || req.query.status === 'unread')) {
    filters.status = req.query.status;
  }
  if (req.query.type) {
    filters.type = req.query.type as NotificationFilters['type'];
  }
  if (req.query.priority) {
    filters.priority = req.query.priority as NotificationFilters['priority'];
  }
  if (req.query.since) {
    filters.since = new Date(req.query.since as string);
  }

  const pagination: NotificationPaginationOptions = {};
  if (req.query.limit) {
    pagination.limit = parseInt(req.query.limit as string, 10);
  }
  if (req.query.cursor) {
    pagination.cursor = req.query.cursor as string;
  }

  const result = await notificationService.list(
    tenantId,
    req.user.sub,
    req.user.type,
    filters,
    pagination,
    { ipAddress, userAgent, channel }
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/notifications/:id
 * Get a specific notification
 */
export async function getNotification(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  const { ipAddress, userAgent, channel } = getClientInfo(req);
  const { id } = req.params;

  const result = await notificationService.getById(
    id,
    tenantId,
    req.user.sub,
    req.user.type,
    { ipAddress, userAgent, channel }
  );

  if (!result.success) {
    const status = result.errorCode === 'NOTIFICATION_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a notification as read
 */
export async function markAsRead(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  const { ipAddress, userAgent, channel } = getClientInfo(req);
  const { id } = req.params;

  const result = await notificationService.markAsRead(
    id,
    tenantId,
    req.user.sub,
    req.user.type,
    { ipAddress, userAgent, channel }
  );

  if (!result.success) {
    const status = result.errorCode === 'NOTIFICATION_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * PATCH /api/v1/notifications/:id/unread
 * Mark a notification as unread
 */
export async function markAsUnread(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  const { ipAddress, userAgent, channel } = getClientInfo(req);
  const { id } = req.params;

  const result = await notificationService.markAsUnread(
    id,
    tenantId,
    req.user.sub,
    req.user.type,
    { ipAddress, userAgent, channel }
  );

  if (!result.success) {
    const status = result.errorCode === 'NOTIFICATION_NOT_FOUND' ? 404 : 500;
    res.status(status).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * POST /api/v1/notifications/mark-read
 * Mark multiple notifications as read
 */
export async function markManyAsRead(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);
  const { ipAddress, userAgent, channel } = getClientInfo(req);
  const ids = req.body.ids as string[] | undefined;

  const result = await notificationService.markManyAsRead(
    tenantId,
    req.user.sub,
    req.user.type,
    ids,
    { ipAddress, userAgent, channel }
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/notifications/unread-count
 * Get unread notification count
 */
export async function getUnreadCount(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const tenantId = getTenantId(req);

  const result = await notificationService.getUnreadCount(
    tenantId,
    req.user.sub,
    req.user.type
  );

  if (!result.success) {
    res.status(500).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}
