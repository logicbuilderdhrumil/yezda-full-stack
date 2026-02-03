/**
 * User Profile Fixtures
 * Mock data for user profile endpoints in development mode.
 */

export interface MockUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  tenantId: string;
  roles: string[];
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  createdAt: string;
  updatedAt: string;
}

/**
 * Mock user profiles for development
 */
export const mockUserProfiles: MockUserProfile[] = [
  {
    id: 'mock-user-admin-001',
    email: 'admin@mock.yezda.dev',
    firstName: 'Mock',
    lastName: 'Admin',
    phone: '+1-555-MOCK-001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    tenantId: 'mock-tenant-001',
    roles: ['admin', 'manager'],
    preferences: {
      theme: 'system',
      language: 'en-US',
      timezone: 'America/New_York',
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-02-03T00:00:00.000Z',
  },
  {
    id: 'mock-user-agent-001',
    email: 'agent@mock.yezda.dev',
    firstName: 'Mock',
    lastName: 'Agent',
    phone: '+1-555-MOCK-002',
    tenantId: 'mock-tenant-001',
    roles: ['agent'],
    preferences: {
      theme: 'light',
      language: 'en-US',
      timezone: 'America/Chicago',
      notifications: {
        email: true,
        push: true,
        sms: true,
      },
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-02-03T00:00:00.000Z',
  },
  {
    id: 'mock-candidate-001',
    email: 'candidate@mock.yezda.dev',
    firstName: 'Mock',
    lastName: 'Candidate',
    phone: '+1-555-MOCK-003',
    tenantId: 'mock-tenant-001',
    roles: [],
    preferences: {
      theme: 'dark',
      language: 'en-US',
      timezone: 'America/Los_Angeles',
      notifications: {
        email: true,
        push: false,
        sms: false,
      },
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-02-03T00:00:00.000Z',
  },
];

/**
 * Find mock user profile by ID
 */
export function findMockUserProfileById(userId: string): MockUserProfile | undefined {
  return mockUserProfiles.find((u) => u.id === userId);
}

/**
 * Find mock user profiles by tenant
 */
export function findMockUserProfilesByTenant(tenantId: string): MockUserProfile[] {
  return mockUserProfiles.filter((u) => u.tenantId === tenantId);
}
