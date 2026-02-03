/**
 * OAuth Integration Routes
 * Task 1.2, 1.3, 1.5, 1.7: OAuth endpoints with rate limiting and CSRF protection
 */

import { Router } from 'express';
import {
  getProviders,
  authorize,
  callback,
  getStatus,
  getAllStatuses,
  disconnect,
  refreshIntegrationToken,
} from '../controllers/oauth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { oauthRateLimiter, oauthCallbackRateLimiter } from '../middleware/oauth-rate-limit.middleware.js';

const router = Router();

/**
 * GET /api/v1/oauth/providers
 * Get list of configured OAuth providers (public)
 */
router.get('/providers', getProviders);

/**
 * POST /api/v1/oauth/authorize/:provider
 * Start OAuth authorization flow
 * Requires authentication
 */
router.post(
  '/authorize/:provider',
  oauthRateLimiter,
  requireAuth,
  authorize
);

/**
 * GET /api/v1/oauth/callback/:provider
 * Handle OAuth provider callback
 * Rate limited to prevent abuse
 * No auth required (callback from provider)
 */
router.get(
  '/callback/:provider',
  oauthCallbackRateLimiter,
  callback
);

/**
 * GET /api/v1/oauth/status/:provider
 * Get integration status for a specific provider
 * Requires authentication
 */
router.get(
  '/status/:provider',
  oauthRateLimiter,
  requireAuth,
  getStatus
);

/**
 * GET /api/v1/oauth/status
 * Get all integration statuses
 * Requires authentication
 */
router.get(
  '/status',
  oauthRateLimiter,
  requireAuth,
  getAllStatuses
);

/**
 * DELETE /api/v1/oauth/integration/:provider
 * Disconnect an integration
 * Requires authentication
 */
router.delete(
  '/integration/:provider',
  oauthRateLimiter,
  requireAuth,
  disconnect
);

/**
 * POST /api/v1/oauth/refresh/:provider
 * Manually refresh an integration token
 * Requires authentication
 */
router.post(
  '/refresh/:provider',
  oauthRateLimiter,
  requireAuth,
  refreshIntegrationToken
);

export default router;
