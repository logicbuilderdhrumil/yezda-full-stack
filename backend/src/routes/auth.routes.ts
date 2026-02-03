/**
 * Auth Routes
 * Task 1.2, 1.3, 1.4: Authentication API endpoints
 */

import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  authRateLimiter,
  passwordResetRateLimiter,
} from '../middleware/rate-limit.middleware.js';
import {
  validateBody,
  signUpSchema,
  signInSchema,
  mfaVerifySchema,
  refreshTokenSchema,
  passwordResetRequestSchema,
  passwordResetCompleteSchema,
  mfaEnrollmentVerifySchema,
} from '../middleware/validation.middleware.js';

const router = Router();

// Public authentication endpoints with rate limiting
router.post(
  '/signup',
  authRateLimiter,
  validateBody(signUpSchema),
  authController.signUp
);

router.post(
  '/signin',
  authRateLimiter,
  validateBody(signInSchema),
  authController.signIn
);

router.post(
  '/mfa/verify',
  authRateLimiter,
  validateBody(mfaVerifySchema),
  authController.verifyMfa
);

router.post(
  '/refresh',
  authRateLimiter,
  validateBody(refreshTokenSchema),
  authController.refreshToken
);

// Password reset endpoints with stricter rate limiting
router.post(
  '/password/reset-request',
  passwordResetRateLimiter,
  validateBody(passwordResetRequestSchema),
  authController.requestPasswordReset
);

router.post(
  '/password/reset-complete',
  passwordResetRateLimiter,
  validateBody(passwordResetCompleteSchema),
  authController.completePasswordReset
);

// Protected endpoints requiring authentication
router.post('/signout', requireAuth, authController.signOut);

router.get('/me', requireAuth, authController.getCurrentUser);

// MFA management (requires authentication)
router.post('/mfa/enroll', requireAuth, authController.startMfaEnrollment);

router.post(
  '/mfa/enroll/verify',
  requireAuth,
  validateBody(mfaEnrollmentVerifySchema),
  authController.completeMfaEnrollment
);

router.delete('/mfa', requireAuth, authController.disableMfa);

export default router;
