/**
 * User management types for the frontend.
 * Note: UserRole is imported from auth.ts to avoid duplication.
 */

import type { UserRole } from './auth';

// Re-export UserRole for convenience when importing from user module
export type { UserRole };

/** User status in management context. */
export type UserStatus = 'active' | 'inactive' | 'pending';

/** User record for management views. */
export interface ManagedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  organizationId?: string;
  organizationName?: string;
  phone?: string;
  avatarUrl?: string;
  mfaEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Payload for creating a user. */
export interface CreateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId?: string;
  phone?: string;
  password?: string;
  sendInvitation?: boolean;
}

/** Payload for updating a user. */
export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  organizationId?: string;
  phone?: string;
}

/** Filter parameters for listing users. */
export interface UserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: UserStatus;
  role?: UserRole;
  organizationId?: string;
  sortBy?: 'email' | 'firstName' | 'lastName' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/** Paginated list response for users. */
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
  { key: 'role', label: 'Role', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'createdAt', label: 'Created', sortable: true },
  { key: 'actions', label: '', sortable: false, width: '100px' },
];
