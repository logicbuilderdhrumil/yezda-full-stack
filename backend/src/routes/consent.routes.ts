/**
 * Consent routes for data reuse consent endpoints.
 * Integration alignment: app/backend consent flows.
 */

import { Router } from 'express';
import {
  getPrompt,
  submit,
  getStatus,
  getById,
  update,
} from '../controllers/consent.controller.js';

const router = Router();

/**
 * GET /api/v1/consent/prompt/:applicationId
 * Get consent prompt for an application.
 */
router.get('/prompt/:applicationId', getPrompt);

/**
 * GET /api/v1/consent
 * Get all consents for current user.
 */
router.get('/', getStatus);

/**
 * GET /api/v1/consent/:consentId
 * Get a single consent by ID.
 */
router.get('/:consentId', getById);

/**
 * POST /api/v1/consent
 * Submit consent decision.
 */
router.post('/', submit);

/**
 * PATCH /api/v1/consent/:consentId
 * Update consent (modify scopes or withdraw).
 */
router.patch('/:consentId', update);

export default router;
