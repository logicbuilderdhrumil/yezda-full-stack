/**
 * User Management Interface Layer — barrel export
 */
export { UserManagementController } from './controllers/user-management.controller.js';
export { createUserManagementRoutes } from './routes/user-management.routes.js';
export {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  updateUserRolesSchema,
  userSearchQuerySchema,
  userIdParamSchema,
} from './validators/user-management.validators.js';
