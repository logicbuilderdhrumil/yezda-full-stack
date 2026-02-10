/**
 * User Management Routes
 *
 * Wires Express routes to the UserManagementController.
 * Uses shared infrastructure middleware for auth, RBAC, validation, and rate limiting.
 */
import { Router } from 'express';
import type { UserManagementController } from '../controllers/user-management.controller.js';
import { requireAuthGuard, requireRoleGuard } from '../../../../shared/infrastructure/middleware/index.js';
import { validateBody, validateQuery, validateParams } from '../../../../shared/infrastructure/middleware/index.js';
import {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  updateUserRolesSchema,
  userSearchQuerySchema,
  userIdParamSchema,
} from '../validators/user-management.validators.js';
import {
  userManagementListRateLimiter,
  userManagementCreateRateLimiter,
  userManagementUpdateRateLimiter,
  userManagementDeleteRateLimiter,
} from '../middleware/user-management-rate-limit.middleware.js';

export function createUserManagementRoutes(controller: UserManagementController): Router {
  const router = Router();

  // List users
  router.get(
    '/',
    userManagementListRateLimiter,
    validateQuery(userSearchQuerySchema),
    requireAuthGuard,
    requireRoleGuard('platform_admin', 'platform_manager'),
    controller.listUsers,
  );

  // Create user
  router.post(
    '/',
    userManagementCreateRateLimiter,
    validateBody(createUserSchema),
    requireAuthGuard,
    requireRoleGuard('platform_admin', 'platform_manager'),
    controller.createUser,
  );

  // Get user by ID
  router.get(
    '/:id',
    userManagementListRateLimiter,
    validateParams(userIdParamSchema),
    requireAuthGuard,
    requireRoleGuard('platform_admin', 'platform_manager'),
    controller.getUserById,
  );

  // Update user
  router.patch(
    '/:id',
    userManagementUpdateRateLimiter,
    validateParams(userIdParamSchema),
    validateBody(updateUserSchema),
    requireAuthGuard,
    requireRoleGuard('platform_admin', 'platform_manager'),
    controller.updateUser,
  );

  // Update user status
  router.patch(
    '/:id/status',
    userManagementUpdateRateLimiter,
    validateParams(userIdParamSchema),
    validateBody(updateUserStatusSchema),
    requireAuthGuard,
    requireRoleGuard('platform_admin', 'platform_manager'),
    controller.updateUserStatus,
  );

  // Update user roles
  router.patch(
    '/:id/roles',
    userManagementUpdateRateLimiter,
    validateParams(userIdParamSchema),
    validateBody(updateUserRolesSchema),
    requireAuthGuard,
    requireRoleGuard('platform_admin', 'platform_manager'),
    controller.updateUserRoles,
  );

  // Delete user (admin only — enforced in use case as well)
  router.delete(
    '/:id',
    userManagementDeleteRateLimiter,
    validateParams(userIdParamSchema),
    requireAuthGuard,
    requireRoleGuard('platform_admin'),
    controller.deleteUser,
  );

  return router;
}
