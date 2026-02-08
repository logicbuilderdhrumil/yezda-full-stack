/**
 * App Consent Routes (Clean Architecture)
 */

import { Router } from 'express';
import type { AppConsentController } from '../controllers/app-consent.controller.js';
import { requireAuth, requireUserType } from '../../../../middleware/auth.middleware.js';
import { validateBody, validateParams } from '../../../../middleware/validation.middleware.js';
import {
  consentCaptureSchema,
  consentWithdrawalSchema,
  dataReuseCheckSchema,
} from '../../../../models/app-consent.model.js';
import { z } from 'zod';

const candidateIdParamSchema = z.object({ candidateId: z.string().uuid() });

export function createAppConsentRoutes(controller: AppConsentController): Router {
  const router = Router();

  router.post(
    '/',
    requireAuth,
    requireUserType('candidate'),
    validateBody(consentCaptureSchema),
    (req, res, next) => controller.captureConsent(req, res, next),
  );
  router.get(
    '/',
    requireAuth,
    (req, res, next) => controller.getConsentStatus(req, res, next),
  );
  router.get(
    '/:candidateId',
    requireAuth,
    requireUserType('user'),
    validateParams(candidateIdParamSchema),
    (req, res, next) => controller.getCandidateConsentStatus(req, res, next),
  );
  router.delete(
    '/',
    requireAuth,
    requireUserType('candidate'),
    validateBody(consentWithdrawalSchema),
    (req, res, next) => controller.withdrawConsent(req, res, next),
  );
  router.post(
    '/check-reuse',
    requireAuth,
    requireUserType('user'),
    validateBody(dataReuseCheckSchema),
    (req, res, next) => controller.checkDataReuse(req, res, next),
  );

  return router;
}
