/**
 * User management types for the frontend.
 * Aligned with backend contract (user-management.model.ts).
 * Note: UserRole is imported from auth.ts to avoid duplication.
 */

import type { UserRole } from './auth';

// Re-export UserRole for convenience when importing from user module
export type { UserRole };

/** User status in management context - matches backend UserStatus. */
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

/** User record for management views - aligned with backend ManagedUser. */
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
  lockedUntil?: string;
  lastLoginAt?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

/** Payload for creating a user - aligned with backend CreateUserInput. */
export interface CreateUserPayload {
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  status?: UserStatus;
  roles: UserRole[];
  password?: string;
}

/** Payload for updating a user - aligned with backend UpdateUserInput. */
export interface UpdateUserPayload {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  status?: UserStatus;
  roles?: UserRole[];
}

/** Filter parameters for listing users - aligned with backend UserSearchParams. */
export interface UserListParams {
  /** Page number (1-indexed, for convenience) */
  page?: number;
  /** Items per page (maps to limit) */
  pageSize?: number;
  /** Search query */
  search?: string;
  /** Filter by status */
  status?: UserStatus;
  /** Filter by role */
  role?: UserRole;
  /** Sort field */
  sortBy?: 'email' | 'displayName' | 'firstName' | 'lastName' | 'createdAt' | 'updatedAt';
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/** Backend list result structure - matches UserListResult. */
export interface UserListResult {
  users: ManagedUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Paginated list response for users - normalized for frontend consumption. */
export interface UserListResponse {
  data: ManagedUser[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

/** Table column definition for users. */
export interface UserColumn {
  key: keyof ManagedUser | 'name' | 'actions';
  label: string;
  sortable?: boolean;
  width?: string;
}

/** Default columns for the users list. */
export const USER_COLUMNS: UserColumn[] = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'roles', label: 'Roles', sortable: false },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'createdAt', label: 'Created', sortable: true },
  { key: 'actions', label: '', sortable: false, width: '100px' },
];

/**
 * Helper to get display name from user.
 * Falls back to email if no name is set.
 */
export function getUserDisplayName(user: ManagedUser): string {
  if (user.displayName) return user.displayName;
  if (user.firstName || user.lastName) {
    return [user.firstName, user.lastName].filter(Boolean).join(' ');
  }
  return user.email;
}
