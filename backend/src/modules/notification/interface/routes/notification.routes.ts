/**
 * Notification Routes
 */
import { Router } from 'express';
import type { NotificationController } from '../controllers/notification.controller.js';
import { requireAuthGuard, validateBody, validateQuery, validateParams } from '../../../../shared/infrastructure/middleware/index.js';
import { listNotificationsQuerySchema, markManyAsReadSchema, idParamSchema } from '../validators/notification.validators.js';
import { notificationRateLimiter } from '../middleware/notification-rate-limit.middleware.js';

export function createNotificationRoutes(controller: NotificationController): Router {
  const router = Router();
  router.use(requireAuthGuard);
  router.use(notificationRateLimiter);

  router.get('/', validateQuery(listNotificationsQuerySchema), controller.listNotifications);
  router.get('/unread-count', controller.getUnreadCount);
  router.get('/:id', validateParams(idParamSchema), controller.getNotification);
  router.patch('/:id/read', validateParams(idParamSchema), controller.markAsRead);
  router.patch('/:id/unread', validateParams(idParamSchema), controller.markAsUnread);
  router.post('/mark-read', validateBody(markManyAsReadSchema), controller.markManyAsRead);

  return router;
}
