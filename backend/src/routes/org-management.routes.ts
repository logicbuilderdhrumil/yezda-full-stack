/**
 * Organization Management Routes
 * Task 1.2, 1.3: Organization API endpoints
 * Task 1.5: RBAC enforcement - system admins only
 * Task 1.7: Rate limiting for organization endpoints
 */

import { Router } from 'express';
import * as orgController from '../controllers/org-management.controller.js';
import { requireAuthGuard, requireRoleGuard } from '../middleware/route-guards.middleware.js';
import { orgListRateLimiter, orgMutationRateLimiter } from '../middleware/org-management-rate-limit.middleware.js';
import {
  validateQuery,
  validateBody,
  validateParams,
} from '../middleware/validation.middleware.js';
import {
  listOrganizationsQuerySchema,
  createOrganizationSchema,
  updateOrganizationSchema,
  orgIdParamSchema,
} from '../models/org-management.model.js';

const router = Router();

// All organization endpoints require authentication
router.use(requireAuthGuard);

// All organization endpoints require admin role
// This enforces RBAC for all organization management operations
router.use(requireRoleGuard('admin'));

/**
 * GET /api/v1/organizations
 * List organizations with optional filters and pagination
 */
router.get(
  '/',
  orgListRateLimiter,
  validateQuery(listOrganizationsQuerySchema),
  orgController.listOrganizations
);

/**
 * GET /api/v1/organizations/:id
 * Get organization details by ID
 */
router.get(
  '/:id',
  orgListRateLimiter,
  validateParams(orgIdParamSchema),
  orgController.getOrganization
);

/**
 * POST /api/v1/organizations
 * Create a new organization
 */
router.post(
  '/',
  orgMutationRateLimiter,
  validateBody(createOrganizationSchema),
  orgController.createOrganization
);

/**
 * PATCH /api/v1/organizations/:id
 * Update an existing organization
 */
router.patch(
  '/:id',
  orgMutationRateLimiter,
  validateParams(orgIdParamSchema),
  validateBody(updateOrganizationSchema),
  orgController.updateOrganization
);

export default router;
