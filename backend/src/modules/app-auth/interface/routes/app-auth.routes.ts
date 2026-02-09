/**
 * App Auth Routes (Clean Architecture)
 * Mobile app authentication endpoints
 */

import { Router } from 'express';
import type { AppAuthController } from '../controllers/app-auth.controller.js';
import { requireAuth } from '../../../../middleware/auth.middleware.js';
import {
  appSignInRateLimiter,
  appRefreshRateLimiter,
  appMfaRateLimiter,
} from '../../../../middleware/app-auth-rate-limit.middleware.js';
import {
  validateBody,
  appSignInSchema,
  appMfaVerifySchema,
  appRefreshTokenSchema,
} from '../../../../middleware/validation.middleware.js';

export function createAppAuthRoutes(controller: AppAuthController): Router {
  const router = Router();

  router.post('/sign-in', appSignInRateLimiter, validateBody(appSignInSchema), controller.appSignIn);
  router.post('/mfa/verify', appMfaRateLimiter, validateBody(appMfaVerifySchema), controller.appVerifyMfa);
  router.post('/refresh', appRefreshRateLimiter, validateBody(appRefreshTokenSchema), controller.appRefreshToken);
  router.post('/sign-out', requireAuth, controller.appSignOut);
  router.get('/sessions', requireAuth, controller.getAppSessions);
  router.delete('/sessions/:sessionId', requireAuth, controller.revokeAppSession);

  return router;
}
