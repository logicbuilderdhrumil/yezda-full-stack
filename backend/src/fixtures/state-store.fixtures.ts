/**
 * State Store Fixtures
 * Mock data for state store endpoints in development mode.
 */

export interface MockStateEntry {
  id: string;
  key: string;
  value: string;
  userId: string;
  userType: 'user' | 'candidate';
  tenantId: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mock state entries for development
 */
export const mockStateEntries: MockStateEntry[] = [
  {
    id: 'mock-state-001',
    key: 'dashboard.layout',
    value: JSON.stringify({
      widgets: ['overview', 'recent-activity', 'pending-tasks'],
      collapsed: false,
    }),
    userId: 'mock-user-admin-001',
    userType: 'user',
    tenantId: 'mock-tenant-001',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
  },
  {
    id: 'mock-state-002',
    key: 'screening.filters',
    value: JSON.stringify({
      status: ['pending', 'in-progress'],
      dateRange: 'last-30-days',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    }),
    userId: 'mock-user-agent-001',
    userType: 'user',
    tenantId: 'mock-tenant-001',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-03T00:00:00.000Z',
  },
];

/**
 * Find mock state entries for a user
 */
export function findMockStateEntriesForUser(
  userId: string,
  userType: 'user' | 'candidate',
  tenantId: string
): MockStateEntry[] {
  return mockStateEntries.filter(
    (e) => e.userId === userId && e.userType === userType && e.tenantId === tenantId
  );
}

/**
 * Find mock state entry by key
 */
export function findMockStateEntryByKey(
  userId: string,
  userType: 'user' | 'candidate',
  tenantId: string,
  key: string
): MockStateEntry | undefined {
  return mockStateEntries.find(
    (e) =>
      e.userId === userId &&
      e.userType === userType &&
      e.tenantId === tenantId &&
      e.key === key
  );
}
