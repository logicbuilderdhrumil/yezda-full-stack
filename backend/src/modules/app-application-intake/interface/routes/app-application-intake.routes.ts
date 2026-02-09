/**
 * App Application Intake Routes (Clean Architecture)
 */

import { Router } from 'express';
import type { AppApplicationIntakeController } from '../controllers/app-application-intake.controller.js';
import { requireAuth, requireUserType } from '../../../../middleware/auth.middleware.js';
import { validateBody } from '../../../../middleware/validation.middleware.js';
import { z } from 'zod';

const saveDraftSchema = z.object({
  responses: z.array(
    z.object({ fieldId: z.string().min(1), value: z.unknown() })
  ).min(1),
});

const submitApplicationSchema = z.object({
  responses: z.array(
    z.object({ fieldId: z.string().min(1), value: z.unknown() })
  ),
});

export function createAppApplicationIntakeRoutes(controller: AppApplicationIntakeController): Router {
  const router = Router();

  router.use(requireAuth, requireUserType('candidate'));

  router.get('/', controller.listAssignedApplications);
  router.get('/:applicationId', controller.loadApplicationForm);
  router.post('/:applicationId/draft', validateBody(saveDraftSchema), controller.saveDraft);
  router.post('/:applicationId/submit', validateBody(submitApplicationSchema), controller.submitApplication);

  return router;
}
