/**
 * App Auth Routes
 * Task 1.1: App authentication API endpoints for mobile flows
 */

import { Router } from 'express';
import * as appAuthController from '../controllers/app-auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  appSignInRateLimiter,
  appRefreshRateLimiter,
  appMfaRateLimiter,
} from '../middleware/app-auth-rate-limit.middleware.js';
import {
  validateBody,
  appSignInSchema,
  appMfaVerifySchema,
  appRefreshTokenSchema,
} from '../middleware/validation.middleware.js';

const router = Router();

// Public app authentication endpoints with rate limiting
router.post(
  '/sign-in',
  appSignInRateLimiter,
  validateBody(appSignInSchema),
  appAuthController.appSignIn
);

router.post(
  '/mfa/verify',
  appMfaRateLimiter,
  validateBody(appMfaVerifySchema),
  appAuthController.appVerifyMfa
);

router.post(
  '/refresh',
  appRefreshRateLimiter,
  validateBody(appRefreshTokenSchema),
  appAuthController.appRefreshToken
);

// Protected endpoints requiring authentication
router.post('/sign-out', requireAuth, appAuthController.appSignOut);

router.get('/sessions', requireAuth, appAuthController.getAppSessions);

router.delete('/sessions/:sessionId', requireAuth, appAuthController.revokeAppSession);

export default router;
