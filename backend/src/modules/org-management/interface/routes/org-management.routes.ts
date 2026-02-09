/**
 * Org Management Routes
 *
 * Maps HTTP verbs to controller methods with auth, role-guard, validation, and rate-limiting.
 */
import { Router } from 'express';
import type { OrgManagementController } from '../controllers/org-management.controller.js';
import { requireAuthGuard, requireRoleGuard, validateBody, validateQuery, validateParams } from '../../../../shared/infrastructure/middleware/index.js';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  listOrganizationsQuerySchema,
  orgIdParamSchema,
  updateStatusSchema,
} from '../validators/org-management.validators.js';
import {
  orgManagementReadRateLimiter,
  orgManagementWriteRateLimiter,
} from '../middleware/org-management-rate-limit.middleware.js';

export function createOrgManagementRoutes(controller: OrgManagementController): Router {
  const router = Router();

  // List organizations
  router.get(
    '/',
    requireAuthGuard,
    requireRoleGuard('admin'),
    orgManagementReadRateLimiter,
    validateQuery(listOrganizationsQuerySchema),
    controller.listOrganizations,
  );

  // Create organization
  router.post(
    '/',
    requireAuthGuard,
    requireRoleGuard('admin'),
    orgManagementWriteRateLimiter,
    validateBody(createOrganizationSchema),
    controller.createOrganization,
  );

  // Get organization by ID
  router.get(
    '/:id',
    requireAuthGuard,
    requireRoleGuard('admin'),
    orgManagementReadRateLimiter,
    validateParams(orgIdParamSchema),
    controller.getOrganizationById,
  );

  // Update organization
  router.put(
    '/:id',
    requireAuthGuard,
    requireRoleGuard('admin'),
    orgManagementWriteRateLimiter,
    validateParams(orgIdParamSchema),
    validateBody(updateOrganizationSchema),
    controller.updateOrganization,
  );

  // Update organization status
  router.patch(
    '/:id/status',
    requireAuthGuard,
    requireRoleGuard('admin'),
    orgManagementWriteRateLimiter,
    validateParams(orgIdParamSchema),
    validateBody(updateStatusSchema),
    controller.updateOrganizationStatus,
  );

  // Delete (soft-delete) organization
  router.delete(
    '/:id',
    requireAuthGuard,
    requireRoleGuard('admin'),
    orgManagementWriteRateLimiter,
    validateParams(orgIdParamSchema),
    controller.deleteOrganization,
  );

  return router;
}
