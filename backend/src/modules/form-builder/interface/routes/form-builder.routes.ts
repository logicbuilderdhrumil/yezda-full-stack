/**
 * Form Builder Routes
 *
 * Wires Express routes to the FormBuilderController.
 * Uses shared infrastructure middleware for auth, RBAC, validation, and rate limiting.
 */
import { Router } from 'express';
import type { FormBuilderController } from '../controllers/form-builder.controller.js';
import { requireAuthGuard, requireRoleGuard } from '../../../../shared/infrastructure/middleware/index.js';
import { validateBody, validateQuery, validateParams } from '../../../../shared/infrastructure/middleware/index.js';
import {
  createFormRequestSchema,
  updateFormRequestSchema,
  listFormsQuerySchema,
  formIdParamSchema,
} from '../validators/form-builder.validators.js';
import {
  formBuilderReadRateLimiter,
  formBuilderWriteRateLimiter,
} from '../middleware/form-builder-rate-limit.middleware.js';

export function createFormBuilderRoutes(controller: FormBuilderController): Router {
  const router = Router();

  // Health (public)
  router.get('/health', controller.getHealth);

  // List forms
  router.get(
    '/',
    formBuilderReadRateLimiter,
    validateQuery(listFormsQuerySchema),
    requireAuthGuard,
    requireRoleGuard('admin', 'manager'),
    controller.listForms,
  );

  // Create form
  router.post(
    '/',
    formBuilderWriteRateLimiter,
    validateBody(createFormRequestSchema),
    requireAuthGuard,
    requireRoleGuard('admin'),
    controller.createForm,
  );

  // Get form
  router.get(
    '/:formId',
    formBuilderReadRateLimiter,
    validateParams(formIdParamSchema),
    requireAuthGuard,
    requireRoleGuard('admin', 'manager', 'agent'),
    controller.getForm,
  );

  // Update form
  router.put(
    '/:formId',
    formBuilderWriteRateLimiter,
    validateParams(formIdParamSchema),
    validateBody(updateFormRequestSchema),
    requireAuthGuard,
    requireRoleGuard('admin'),
    controller.updateForm,
  );

  // Delete form
  router.delete(
    '/:formId',
    formBuilderWriteRateLimiter,
    validateParams(formIdParamSchema),
    requireAuthGuard,
    requireRoleGuard('admin'),
    controller.deleteForm,
  );

  return router;
}
