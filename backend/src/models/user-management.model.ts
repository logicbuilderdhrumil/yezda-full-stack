/**
 * User Management Models
 * Task 1.1: Define user schema and validation rules
 */

import type { UserRole } from '../middleware/route-guards.middleware.js';

/**
 * User status for account management
 */
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

/**
 * Extended user entity for management operations
 */
export interface ManagedUser {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  status: UserStatus;
  roles: UserRole[];
  tenantId: string;
  userSpace: 'platform' | 'organization';
  mfaEnabled: boolean;
  lockedUntil?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Input for creating a user
 */
export interface CreateUserInput {
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  status?: UserStatus;
  roles: UserRole[];
  tenantId: string;
  userSpace: 'platform' | 'organization';
  password?: string;
}

/**
 * Input for updating a user
 */
export interface UpdateUserInput {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  status?: UserStatus;
  roles?: UserRole[];
}

/**
 * User search/filter parameters
 */
export interface UserSearchParams {
  tenantId: string;
  userSpace?: 'platform' | 'organization';
  query?: string;
  status?: UserStatus;
  role?: UserRole;
  page?: number;
  limit?: number;
  sortBy?: 'email' | 'displayName' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated user list result
 */
export interface UserListResult {
  users: ManagedUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * User management audit event types
 */
export type UserManagementAuditEventType =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_STATUS_CHANGED'
  | 'USER_ROLE_CHANGED'
  | 'USER_DELETED'
  | 'USER_LIST_ACCESSED'
  | 'USER_DETAILS_ACCESSED'
  | 'USER_ACCESS_DENIED';

/**
 * User management operation result
 */
export interface UserManagementResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}
