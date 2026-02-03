/**
 * Users module mock fixtures.
 * Provides fake data for user management endpoints.
 */

/** Generate a mock user with given id. */
export function createMockUser(id: string, overrides?: Partial<MockUser>): MockUser {
  return {
    id,
    email: `user${id}@example.com`,
    firstName: `First${id}`,
    lastName: `Last${id}`,
    role: 'user',
    status: 'active',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Mock user type. */
export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/** Predefined mock users list. */
export const mockUsers: MockUser[] = [
  createMockUser('001', { email: 'admin@example.com', firstName: 'Admin', role: 'admin' }),
  createMockUser('002', { email: 'manager@example.com', firstName: 'Manager', role: 'manager' }),
  createMockUser('003', { email: 'user1@example.com', firstName: 'Alice' }),
  createMockUser('004', { email: 'user2@example.com', firstName: 'Bob' }),
  createMockUser('005', { email: 'user3@example.com', firstName: 'Charlie', status: 'inactive' }),
];

/** Mock paginated users list response. */
export const usersListResponse = {
  data: mockUsers,
  total: mockUsers.length,
  page: 1,
  pageSize: 10,
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
