/**
 * Application routes for screening application endpoints.
 * Integration alignment: app/backend application flows.
 */

import { Router } from 'express';
import {
  list,
  get,
  getDraft,
  saveDraft,
  submit,
} from '../controllers/application.controller.js';

const router = Router();

/**
 * GET /api/v1/applications
 * Get all applications for current user.
 */
router.get('/', list);

/**
 * GET /api/v1/applications/:applicationId
 * Get a single application by ID.
 */
router.get('/:applicationId', get);

/**
 * GET /api/v1/applications/:applicationId/draft
 * Get application draft.
 */
router.get('/:applicationId/draft', getDraft);

/**
 * PUT /api/v1/applications/:applicationId/draft
 * Save application draft.
 */
router.put('/:applicationId/draft', saveDraft);

/**
 * POST /api/v1/applications/:applicationId/submit
 * Submit application.
 */
router.post('/:applicationId/submit', submit);

export default router;
