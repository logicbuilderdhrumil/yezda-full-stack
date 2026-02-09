/**
 * User Management Domain — barrel export
 */

// Entities & types
export type {
  UserRole,
  UserStatus,
  ManagedUser,
  CreateUserDto,
  UpdateUserDto,
  UserSearchParams,
  UserListResult,
  UserManagementResult,
  UserManagementContext,
  UserManagementAuditEventType,
} from './entities/user-management.entity.js';

export {
  USER_ROLES,
  USER_STATUSES,
  canManageUsers,
  canAssignRole,
} from './entities/user-management.entity.js';

// Ports
export type { IUserManagementRepository } from './ports/user-management-repository.port.js';
export type { IAuditService } from './ports/audit-service.port.js';
export type { IMetricsService } from './ports/metrics-service.port.js';
export type { IPasswordService } from './ports/password-service.port.js';
export type { IUserAuthRepository } from './ports/user-auth-repository.port.js';
