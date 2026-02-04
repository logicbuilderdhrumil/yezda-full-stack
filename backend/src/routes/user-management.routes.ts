/**
 * User Management Routes
 * Task 1.2, 1.3, 1.5, 1.7: User management API endpoints
 */

import { Router } from 'express';
import * as userManagementController from '../controllers/user-management.controller.js';
import { requireAuthGuard, requireRoleGuard } from '../middleware/route-guards.middleware.js';
import {
  validateBody,
  validateQuery,
  validateParams,
} from '../middleware/validation.middleware.js';
import {
  userManagementListRateLimiter,
  userManagementCreateRateLimiter,
  userManagementUpdateRateLimiter,
  userManagementDeleteRateLimiter,
} from '../middleware/user-management-rate-limit.middleware.js';
import {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  updateUserRolesSchema,
  userSearchQuerySchema,
  userIdParamSchema,
} from '../middleware/user-management-validation.middleware.js';

const router = Router();

// All user management endpoints require authentication and admin/manager role
const authAndRoleGuards = [
  requireAuthGuard,
  requireRoleGuard('admin', 'manager'),
];

// GET /api/v1/users - List users with search, filter, and pagination
router.get(
  '/',
  ...authAndRoleGuards,
  userManagementListRateLimiter,
  validateQuery(userSearchQuerySchema),
  userManagementController.listUsers
);

// POST /api/v1/users - Create a new user
router.post(
  '/',
  ...authAndRoleGuards,
  userManagementCreateRateLimiter,
  validateBody(createUserSchema),
  userManagementController.createUser
);

// GET /api/v1/users/:id - Get user details
router.get(
  '/:id',
  ...authAndRoleGuards,
  userManagementListRateLimiter,
  validateParams(userIdParamSchema),
  userManagementController.getUserById
);

// PATCH /api/v1/users/:id - Update user details
router.patch(
  '/:id',
  ...authAndRoleGuards,
  userManagementUpdateRateLimiter,
  validateParams(userIdParamSchema),
  validateBody(updateUserSchema),
  userManagementController.updateUser
);

// PATCH /api/v1/users/:id/status - Update user status
router.patch(
  '/:id/status',
  ...authAndRoleGuards,
  userManagementUpdateRateLimiter,
  validateParams(userIdParamSchema),
  validateBody(updateUserStatusSchema),
  userManagementController.updateUserStatus
);

// PATCH /api/v1/users/:id/roles - Update user roles
router.patch(
  '/:id/roles',
  ...authAndRoleGuards,
  userManagementUpdateRateLimiter,
  validateParams(userIdParamSchema),
  validateBody(updateUserRolesSchema),
  userManagementController.updateUserRoles
);

// DELETE /api/v1/users/:id - Delete (deactivate) a user
router.delete(
  '/:id',
  requireAuthGuard,
  requireRoleGuard('admin'), // Only admins can delete
  userManagementDeleteRateLimiter,
  validateParams(userIdParamSchema),
  userManagementController.deleteUser
);

export default router;
