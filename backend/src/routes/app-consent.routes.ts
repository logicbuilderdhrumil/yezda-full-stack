/**
 * App Consent Routes
 * Task 1.1: Consent capture and retrieval API endpoints
 */

import { Router } from 'express';
import * as appConsentController from '../controllers/app-consent.controller.js';
import { requireAuth, requireUserType } from '../middleware/auth.middleware.js';
import { validateBody, validateParams } from '../middleware/validation.middleware.js';
import {
  consentCaptureSchema,
  consentWithdrawalSchema,
  dataReuseCheckSchema,
} from '../models/app-consent.model.js';
import { z } from 'zod';

const router = Router();

// Param validation schemas
const candidateIdParamSchema = z.object({
  candidateId: z.string().uuid(),
});

/**
 * POST /api/v1/consent
 * Capture consent decision (candidate only)
 */
router.post(
  '/',
  requireAuth,
  requireUserType('candidate'),
  validateBody(consentCaptureSchema),
  appConsentController.captureConsent
);

/**
 * GET /api/v1/consent
 * Get current candidate's consent status
 */
router.get(
  '/',
  requireAuth,
  appConsentController.getConsentStatus
);

/**
 * GET /api/v1/consent/:candidateId
 * Get specific candidate's consent status (admin access)
 */
router.get(
  '/:candidateId',
  requireAuth,
  requireUserType('user'),
  validateParams(candidateIdParamSchema),
  appConsentController.getCandidateConsentStatus
);

/**
 * DELETE /api/v1/consent
 * Withdraw consent (candidate only)
 */
router.delete(
  '/',
  requireAuth,
  requireUserType('candidate'),
  validateBody(consentWithdrawalSchema),
  appConsentController.withdrawConsent
);

/**
 * POST /api/v1/consent/check-reuse
 * Check if data reuse is allowed (system/admin access)
 */
router.post(
  '/check-reuse',
  requireAuth,
  requireUserType('user'),
  validateBody(dataReuseCheckSchema),
  appConsentController.checkDataReuse
);

export default router;
