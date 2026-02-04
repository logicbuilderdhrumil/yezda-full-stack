/**
 * App Application Intake Routes
 * Task 1.1: Define app application intake endpoints and contracts
 */

import { Router } from 'express';
import * as appApplicationIntakeController from '../controllers/app-application-intake.controller.js';
import { requireAuth, requireUserType } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { z } from 'zod';

const router = Router();

// Validation schemas for request bodies
const saveDraftSchema = z.object({
  responses: z.array(
    z.object({
      fieldId: z.string().min(1, 'Field ID is required'),
      value: z.unknown(),
    })
  ).min(1, 'At least one response is required'),
});

const submitApplicationSchema = z.object({
  responses: z.array(
    z.object({
      fieldId: z.string().min(1, 'Field ID is required'),
      value: z.unknown(),
    })
  ),
});

// All routes require authentication and candidate user type
router.use(requireAuth, requireUserType('candidate'));

/**
 * GET /api/v1/app/applications
 * List all assigned applications for the authenticated candidate
 */
router.get('/', appApplicationIntakeController.listAssignedApplications);

/**
 * GET /api/v1/app/applications/:applicationId
 * Load a specific application form with saved responses
 */
router.get('/:applicationId', appApplicationIntakeController.loadApplicationForm);

/**
 * POST /api/v1/app/applications/:applicationId/draft
 * Save draft responses for an application
 */
router.post(
  '/:applicationId/draft',
  validateBody(saveDraftSchema),
  appApplicationIntakeController.saveDraft
);

/**
 * POST /api/v1/app/applications/:applicationId/submit
 * Submit a completed application
 */
router.post(
  '/:applicationId/submit',
  validateBody(submitApplicationSchema),
  appApplicationIntakeController.submitApplication
);

export default router;
