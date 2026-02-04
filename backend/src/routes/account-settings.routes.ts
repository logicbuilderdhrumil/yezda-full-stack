/**
 * Account Settings Routes
 * Task 1.2, 1.3, 1.7: Profile and integration API endpoints with rate limiting
 */

import { Router } from 'express';
import * as accountSettingsController from '../controllers/account-settings.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  profileReadRateLimiter,
  profileUpdateRateLimiter,
  integrationStatusRateLimiter,
  integrationCallbackRateLimiter,
} from '../middleware/account-settings-rate-limit.middleware.js';
import {
  validateBody,
  validateParams,
} from '../middleware/validation.middleware.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const profileUpdateSchema = z.object({
  displayName: z.string().max(255).optional(),
  avatarUrl: z.string().url().max(2048).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  timezone: z.string().max(100).optional(),
  locale: z.string().max(20).optional(),
  bio: z.string().max(1000).optional().nullable(),
  notificationsEnabled: z.boolean().optional(),
  emailNotificationsEnabled: z.boolean().optional(),
});

const integrationProviderSchema = z.object({
  provider: z.enum(['google', 'microsoft', 'slack', 'github']),
});

const integrationVerifySchema = z.object({
  success: z.boolean().optional(),
  providerAccountId: z.string().optional(),
  providerEmail: z.string().email().optional(),
  scopes: z.array(z.string()).optional(),
  error: z.string().optional(),
  errorCode: z.string().optional(),
});

// Profile endpoints
router.get(
  '/profile',
  requireAuth,
  profileReadRateLimiter,
  accountSettingsController.getProfile
);

router.patch(
  '/profile',
  requireAuth,
  profileUpdateRateLimiter,
  validateBody(profileUpdateSchema),
  accountSettingsController.updateProfile
);

// Integration endpoints
router.get(
  '/integrations',
  requireAuth,
  integrationStatusRateLimiter,
  accountSettingsController.getIntegrations
);

router.get(
  '/integrations/:provider',
  requireAuth,
  integrationStatusRateLimiter,
  validateParams(integrationProviderSchema),
  accountSettingsController.getIntegration
);

router.post(
  '/integrations/:provider/verify',
  requireAuth,
  integrationCallbackRateLimiter,
  validateParams(integrationProviderSchema),
  validateBody(integrationVerifySchema),
  accountSettingsController.verifyIntegration
);

router.delete(
  '/integrations/:provider',
  requireAuth,
  integrationStatusRateLimiter,
  validateParams(integrationProviderSchema),
  accountSettingsController.disconnectIntegration
);

// Health endpoint
router.get('/health', accountSettingsController.getHealthSummary);

export default router;
