/**
 * Authentication Fixtures
 * Mock data for authentication endpoints in development mode.
 */

export interface MockUser {
  id: string;
  email: string;
  passwordHash: string;
  type: 'user' | 'candidate';
  roles: string[];
  userSpace?: 'platform' | 'organisation';
  tenantId: string;
  firstName: string;
  lastName: string;
  mfaEnabled: boolean;
  emailVerified: boolean;
  status: 'active' | 'locked' | 'pending';
  createdAt: string;
  updatedAt: string;
}

export interface MockSession {
  id: string;
  userId: string;
  userType: 'user' | 'candidate';
  tenantId: string;
  expiresAt: string;
  createdAt: string;
}

/**
 * Mock users for development
 * Password for all mock users: "MockPassword123!"
 */
export const mockUsers: MockUser[] = [
  {
    id: 'mock-user-admin-001',
    email: 'admin@mock.yezda.dev',
    passwordHash: '$2b$10$mock-hash-admin-do-not-use-in-production',
    type: 'user',
    roles: ['platform_admin', 'platform_manager'],
    userSpace: 'platform',
    tenantId: 'mock-tenant-001',
    firstName: 'Mock',
    lastName: 'Admin',
    mfaEnabled: false,
    emailVerified: true,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-02-03T00:00:00.000Z',
  },
  {
    id: 'mock-user-agent-001',
    email: 'agent@mock.yezda.dev',
    passwordHash: '$2b$10$mock-hash-agent-do-not-use-in-production',
    type: 'user',
    roles: ['platform_agent'],
    userSpace: 'platform',
    tenantId: 'mock-tenant-001',
    firstName: 'Mock',
    lastName: 'Agent',
    mfaEnabled: false,
    emailVerified: true,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-02-03T00:00:00.000Z',
  },
  {
    id: 'mock-candidate-001',
    email: 'candidate@mock.yezda.dev',
    passwordHash: '$2b$10$mock-hash-candidate-do-not-use-in-production',
    type: 'candidate',
    roles: [],
    tenantId: 'mock-tenant-001',
    firstName: 'Mock',
    lastName: 'Candidate',
    mfaEnabled: false,
    emailVerified: true,
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-02-03T00:00:00.000Z',
  },
];

/**
 * Mock sessions for development
 */
export const mockSessions: MockSession[] = [
  {
    id: 'mock-session-001',
    userId: 'mock-user-admin-001',
    userType: 'user',
    tenantId: 'mock-tenant-001',
    expiresAt: '2026-12-31T23:59:59.000Z',
    createdAt: '2026-02-03T00:00:00.000Z',
  },
];

/**
 * Mock authentication response for successful login
 */
export interface MockAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: Omit<MockUser, 'passwordHash'>;
}

/**
 * Get mock auth response for a user
 */
export function getMockAuthResponse(userId: string): MockAuthResponse | null {
  const user = mockUsers.find((u) => u.id === userId);
  if (!user) return null;

  const { passwordHash: _, ...userWithoutPassword } = user;
  
  return {
    accessToken: `mock-access-token-${userId}-${Date.now()}`,
    refreshToken: `mock-refresh-token-${userId}-${Date.now()}`,
    expiresIn: 900, // 15 minutes
    user: userWithoutPassword,
  };
}

/**
 * Find mock user by email
 */
export function findMockUserByEmail(email: string): MockUser | undefined {
  return mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

/**
 * Find mock user by ID
 */
export function findMockUserById(userId: string): MockUser | undefined {
  return mockUsers.find((u) => u.id === userId);
}
