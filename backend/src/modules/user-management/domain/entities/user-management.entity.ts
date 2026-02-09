/**
 * User Management Domain Entities
 * Core domain types for user management operations.
 */

// ── Role & Status Types ───────────────────────────────────────────────────────

export const USER_ROLES = ['admin', 'manager', 'agent', 'viewer'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['active', 'inactive', 'suspended', 'pending'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

// ── Core Entity ───────────────────────────────────────────────────────────────

export interface ManagedUser {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  status: UserStatus;
  roles: UserRole[];
  tenantId: string;
  mfaEnabled: boolean;
  lockedUntil?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface CreateUserDto {
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  status?: UserStatus;
  roles: UserRole[];
  password?: string;
}

export interface UpdateUserDto {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  status?: UserStatus;
  roles?: UserRole[];
}

// ── Search & Pagination ───────────────────────────────────────────────────────

export interface UserSearchParams {
  query?: string;
  status?: UserStatus;
  role?: UserRole;
  page?: number;
  limit?: number;
  sortBy?: 'email' | 'displayName' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface UserListResult {
  users: ManagedUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Operation Result ──────────────────────────────────────────────────────────

export interface UserManagementResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

// ── Context ───────────────────────────────────────────────────────────────────

export interface UserManagementContext {
  actorId: string;
  actorType: 'user' | 'candidate';
  actorRoles: UserRole[];
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  channel: 'web' | 'mobile' | 'api';
}

// ── Audit Event Types ─────────────────────────────────────────────────────────

export type UserManagementAuditEventType =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_STATUS_CHANGED'
  | 'USER_ROLE_CHANGED'
  | 'USER_DELETED'
  | 'USER_LIST_ACCESSED'
  | 'USER_DETAILS_ACCESSED'
  | 'USER_ACCESS_DENIED';

// ── Domain helpers ────────────────────────────────────────────────────────────

/**
 * Check if actor has admin or manager role
 */
export function canManageUsers(roles: UserRole[]): boolean {
  return roles.includes('admin') || roles.includes('manager');
}

/**
 * Check if actor can assign a specific role.
 * Admins can assign any role, managers can only assign agent/viewer.
 */
export function canAssignRole(actorRoles: UserRole[], targetRole: UserRole): boolean {
  if (actorRoles.includes('admin')) return true;
  if (actorRoles.includes('manager')) {
    return targetRole === 'agent' || targetRole === 'viewer';
  }
  return false;
}
