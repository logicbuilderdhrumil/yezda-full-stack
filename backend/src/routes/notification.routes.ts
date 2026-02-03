/**
 * Notification Routes
 * Task 1.2, 1.3: Notification API endpoints
 * Task 1.5: Tenant scoping via auth middleware
 * Task 1.7: Rate limiting for notification endpoints
 */

import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { notificationRateLimiter } from '../middleware/notification-rate-limit.middleware.js';
import {
  validateQuery,
  validateBody,
  validateParams,
} from '../middleware/validation.middleware.js';
import { z } from 'zod';

const router = Router();

/**
 * Validation schemas for notification endpoints
 */
const listNotificationsQuerySchema = z.object({
  status: z.enum(['read', 'unread']).optional(),
  type: z.enum(['SYSTEM', 'APPLICATION', 'SCREENING', 'DOCUMENT', 'MESSAGE', 'SECURITY', 'REMINDER']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  since: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  cursor: z.string().optional(),
});

const markManyAsReadSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
});

const idParamSchema = z.object({
  id: z.string().uuid(),
});

// All notification endpoints require authentication
router.use(requireAuth);

// Apply rate limiting to all notification endpoints
router.use(notificationRateLimiter);

/**
 * GET /api/v1/notifications
 * List notifications for the authenticated user
 */
router.get(
  '/',
  validateQuery(listNotificationsQuerySchema),
  notificationController.listNotifications
);

/**
 * GET /api/v1/notifications/unread-count
 * Get unread notification count
 * Note: This must come before /:id to avoid route collision
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * GET /api/v1/notifications/:id
 * Get a specific notification
 */
router.get('/:id', validateParams(idParamSchema), notificationController.getNotification);

/**
 * PATCH /api/v1/notifications/:id/read
 * Mark a notification as read
 */
router.patch('/:id/read', validateParams(idParamSchema), notificationController.markAsRead);

/**
 * PATCH /api/v1/notifications/:id/unread
 * Mark a notification as unread
 */
router.patch('/:id/unread', validateParams(idParamSchema), notificationController.markAsUnread);

/**
 * POST /api/v1/notifications/mark-read
 * Mark multiple notifications as read (or all if no ids provided)
 */
router.post(
  '/mark-read',
  validateBody(markManyAsReadSchema),
  notificationController.markManyAsRead
);

export default router;
