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

  router.post('/', requireAuth, requireUserType('candidate'), validateBody(consentCaptureSchema), controller.captureConsent as any);
  router.get('/', requireAuth, controller.getConsentStatus as any);
  router.get('/:candidateId', requireAuth, requireUserType('user'), validateParams(candidateIdParamSchema), controller.getCandidateConsentStatus as any);
  router.delete('/', requireAuth, requireUserType('candidate'), validateBody(consentWithdrawalSchema), controller.withdrawConsent as any);
  router.post('/check-reuse', requireAuth, requireUserType('user'), validateBody(dataReuseCheckSchema), controller.checkDataReuse as any);

  return router;
}
