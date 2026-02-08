/**
 * Auth Routes (Clean Architecture)
 * Route definitions accepting controller as parameter
 */
import { Router } from 'express';
import type { AuthController } from '../controllers/auth.controller.js';
import { requireAuth } from '../../../../middleware/auth.middleware.js';
import {
  authRateLimiter,
  passwordResetRateLimiter,
} from '../../../../middleware/rate-limit.middleware.js';
import {
  validateBody,
  signUpSchema,
  signInSchema,
  mfaVerifySchema,
  refreshTokenSchema,
  passwordResetRequestSchema,
  passwordResetCompleteSchema,
  mfaEnrollmentVerifySchema,
} from '../../../../middleware/validation.middleware.js';

export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();

  // Public authentication endpoints with rate limiting
  router.post(
    '/sign-up',
    authRateLimiter,
    validateBody(signUpSchema),
    (req, res) => controller.signUp(req, res),
  );

  router.post(
    '/sign-in',
    authRateLimiter,
    validateBody(signInSchema),
    (req, res) => controller.signIn(req, res),
  );

  router.post(
    '/mfa/verify',
    authRateLimiter,
    validateBody(mfaVerifySchema),
    (req, res) => controller.verifyMfa(req, res),
  );

  router.post(
    '/refresh',
    authRateLimiter,
    validateBody(refreshTokenSchema),
    (req, res) => controller.refreshToken(req, res),
  );

  // Password reset endpoints with stricter rate limiting
  router.post(
    '/password/reset-request',
    passwordResetRateLimiter,
    validateBody(passwordResetRequestSchema),
    (req, res) => controller.requestPasswordReset(req, res),
  );

  router.post(
    '/password/reset-complete',
    passwordResetRateLimiter,
    validateBody(passwordResetCompleteSchema),
    (req, res) => controller.completePasswordReset(req, res),
  );

  // Protected endpoints requiring authentication
  router.post('/sign-out', requireAuth, (req, res) => controller.signOut(req, res));

  router.get('/me', requireAuth, (req, res) => controller.getCurrentUser(req, res));

  // MFA management (requires authentication)
  router.post('/mfa/enroll', requireAuth, (req, res) => controller.startMfaEnrollment(req, res));

  router.post(
    '/mfa/enroll/verify',
    requireAuth,
    validateBody(mfaEnrollmentVerifySchema),
    (req, res) => controller.completeMfaEnrollment(req, res),
  );

  router.delete('/mfa', requireAuth, (req, res) => controller.disableMfa(req, res));

  return router;
}
