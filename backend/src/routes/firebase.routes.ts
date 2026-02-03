/**
 * Firebase Routes
 * Task 1.2: Device token registration endpoints
 * Task 1.3: Notification dispatch endpoints
 * Task 1.7: Rate limiting for Firebase endpoints
 */

import { Router } from 'express';
import * as firebaseController from '../controllers/firebase.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRoleGuard } from '../middleware/route-guards.middleware.js';
import {
  firebaseTokenRateLimiter,
  firebaseDispatchRateLimiter,
} from '../middleware/rate-limit.middleware.js';
import {
  validateBody,
  deviceTokenRegistrationSchema,
  deviceTokenUnregistrationSchema,
  notificationDispatchSchema,
} from '../middleware/validation.middleware.js';

const router = Router();

// Device token management endpoints (require authentication)
router.post(
  '/tokens',
  requireAuth,
  firebaseTokenRateLimiter,
  validateBody(deviceTokenRegistrationSchema),
  firebaseController.registerDeviceToken
);

router.delete(
  '/tokens',
  requireAuth,
  firebaseTokenRateLimiter,
  validateBody(deviceTokenUnregistrationSchema),
  firebaseController.unregisterDeviceToken
);

router.delete(
  '/tokens/all',
  requireAuth,
  firebaseTokenRateLimiter,
  firebaseController.unregisterAllDeviceTokens
);

router.get(
  '/tokens',
  requireAuth,
  firebaseController.getActiveDeviceTokens
);

// Notification dispatch endpoint (admin only)
router.post(
  '/notifications/dispatch',
  requireAuth,
  requireRoleGuard('admin'),
  firebaseDispatchRateLimiter,
  validateBody(notificationDispatchSchema),
  firebaseController.dispatchNotification
);

export default router;
