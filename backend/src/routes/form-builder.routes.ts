/**
 * Form Builder Routes
 * Task 1.2: Form list, create, edit, and retrieve API endpoints.
 * Task 1.4: RBAC enforcement for form management.
 * Task 1.6: Rate limiting for form endpoints.
 * Task 1.7: Health check and SLO monitoring endpoint.
 */

import { Router } from 'express';
import * as formBuilderController from '../controllers/form-builder.controller.js';
import { requireAuthGuard, requireRoleGuard } from '../middleware/route-guards.middleware.js';
import { 
  formBuilderReadRateLimiter, 
  formBuilderWriteRateLimiter 
} from '../middleware/form-builder-rate-limit.middleware.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.middleware.js';
import {
  createFormRequestSchema,
  updateFormRequestSchema,
  listFormsQuerySchema,
  formIdParamSchema,
} from '../models/form-builder.model.js';

const router = Router();

/**
 * GET /api/v1/forms/health
 * Health check and SLO status (public)
 * Task 1.7: SLO monitoring
 */
router.get('/health', formBuilderController.getFormBuilderHealth);

/**
 * GET /api/v1/forms
 * List form definitions
 * Task 1.2: List forms with pagination
 * Task 1.4: Requires admin or manager role
 * Task 1.6: Rate limiting
 */
router.get(
  '/',
  formBuilderReadRateLimiter,
  validateQuery(listFormsQuerySchema),
  requireAuthGuard,
  requireRoleGuard('platform_admin', 'platform_manager'),
  formBuilderController.listForms
);

/**
 * POST /api/v1/forms
 * Create a new form definition
 * Task 1.2: Create form
 * Task 1.4: Requires admin role
 * Task 1.6: Rate limiting
 */
router.post(
  '/',
  formBuilderWriteRateLimiter,
  validateBody(createFormRequestSchema),
  requireAuthGuard,
  requireRoleGuard('platform_admin'),
  formBuilderController.createForm
);

/**
 * GET /api/v1/forms/:formId
 * Get a form definition by ID
 * Task 1.2: Retrieve form
 * Task 1.4: Requires admin, manager, or agent role
 * Task 1.6: Rate limiting
 */
router.get(
  '/:formId',
  formBuilderReadRateLimiter,
  validateParams(formIdParamSchema),
  requireAuthGuard,
  requireRoleGuard('platform_admin', 'platform_manager', 'platform_agent'),
  formBuilderController.getForm
);

/**
 * PUT /api/v1/forms/:formId
 * Update a form definition
 * Task 1.2: Edit form
 * Task 1.4: Requires admin role
 * Task 1.6: Rate limiting
 */
router.put(
  '/:formId',
  formBuilderWriteRateLimiter,
  validateParams(formIdParamSchema),
  validateBody(updateFormRequestSchema),
  requireAuthGuard,
  requireRoleGuard('platform_admin'),
  formBuilderController.updateForm
);

/**
 * DELETE /api/v1/forms/:formId
 * Delete (archive) a form definition
 * Task 1.2: Delete form
 * Task 1.4: Requires admin role
 * Task 1.6: Rate limiting
 */
router.delete(
  '/:formId',
  formBuilderWriteRateLimiter,
  validateParams(formIdParamSchema),
  requireAuthGuard,
  requireRoleGuard('platform_admin'),
  formBuilderController.deleteForm
);

export default router;
