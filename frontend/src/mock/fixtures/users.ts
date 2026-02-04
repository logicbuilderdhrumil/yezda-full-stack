/**
 * Users module mock fixtures.
 * Provides fake data for user management endpoints.
 * Aligned with backend contract (user-management.model.ts).
 */

import type { UserRole } from '@/@types/auth';

/** Generate a mock user with given id - aligned with backend ManagedUser. */
export function createMockUser(id: string, overrides?: Partial<MockUser>): MockUser {
  return {
    id,
    email: `user${id}@example.com`,
    displayName: `User ${id}`,
    firstName: `First${id}`,
    lastName: `Last${id}`,
    roles: ['viewer'],
    tenantId: 'tenant-001',
    status: 'active',
    mfaEnabled: false,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Mock user type - aligned with backend ManagedUser. */
export interface MockUser {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  roles: UserRole[];
  tenantId: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  mfaEnabled: boolean;
  lockedUntil?: string;
  lastLoginAt?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

/** Predefined mock users list. */
export const mockUsers: MockUser[] = [
  createMockUser('001', { email: 'admin@example.com', displayName: 'Admin User', roles: ['admin'] }),
  createMockUser('002', { email: 'manager@example.com', displayName: 'Manager User', roles: ['manager'] }),
  createMockUser('003', { email: 'agent1@example.com', displayName: 'Alice Agent', roles: ['agent'] }),
  createMockUser('004', { email: 'agent2@example.com', displayName: 'Bob Agent', roles: ['agent'] }),
  createMockUser('005', { email: 'viewer@example.com', displayName: 'Charlie Viewer', status: 'inactive' }),
];

/** Mock paginated users list response - aligned with backend UserListResult. */
export const usersListResponse = {
  users: mockUsers,
  total: mockUsers.length,
  page: 1,
  limit: 10,
  totalPages: 1,
};

/** Get a single user by ID. */
export function getUserById(id: string): MockUser | undefined {
  return mockUsers.find((user) => user.id === id);
}

/** Mock user creation response. */
export function createUserResponse(data: Partial<MockUser>): MockUser {
  const id = String(mockUsers.length + 1).padStart(3, '0');
  return createMockUser(id, data);
}

/** Mock user update response. */
export function updateUserResponse(id: string, data: Partial<MockUser>): MockUser | undefined {
  const user = getUserById(id);
  if (user) {
    return { ...user, ...data, updatedAt: new Date().toISOString() };
  }
  return undefined;
}

/** Mock user deletion response. */
export const deleteUserResponse = {
  success: true,
  message: 'User deleted successfully.',
};
