/**
 * Notification Fixtures
 * Mock data for notification endpoints in development mode.
 */

export interface MockNotification {
  id: string;
  userId: string;
  userType: 'user' | 'candidate';
  tenantId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  readAt?: string;
}

/**
 * Mock notifications for development
 */
export const mockNotifications: MockNotification[] = [
  {
    id: 'mock-notification-001',
    userId: 'mock-user-admin-001',
    userType: 'user',
    tenantId: 'mock-tenant-001',
    type: 'info',
    title: 'Welcome to Mock Mode',
    message: 'You are running in mock API mode. All data is simulated.',
    read: false,
    createdAt: '2026-02-03T10:00:00.000Z',
  },
  {
    id: 'mock-notification-002',
    userId: 'mock-user-admin-001',
    userType: 'user',
    tenantId: 'mock-tenant-001',
    type: 'success',
    title: 'Screening Complete',
    message: 'Background check for Mock Candidate has been completed.',
    read: true,
    actionUrl: '/screenings/mock-screening-001',
    readAt: '2026-02-03T11:00:00.000Z',
    createdAt: '2026-02-03T09:00:00.000Z',
  },
  {
    id: 'mock-notification-003',
    userId: 'mock-candidate-001',
    userType: 'candidate',
    tenantId: 'mock-tenant-001',
    type: 'info',
    title: 'Action Required',
    message: 'Please complete your employment verification form.',
    read: false,
    actionUrl: '/forms/employment-verification',
    createdAt: '2026-02-03T08:00:00.000Z',
  },
  {
    id: 'mock-notification-004',
    userId: 'mock-user-agent-001',
    userType: 'user',
    tenantId: 'mock-tenant-001',
    type: 'warning',
    title: 'Document Expiring',
    message: 'A candidate document will expire in 7 days.',
    read: false,
    createdAt: '2026-02-02T15:00:00.000Z',
  },
  {
    id: 'mock-notification-005',
    userId: 'mock-user-admin-001',
    userType: 'user',
    tenantId: 'mock-tenant-001',
    type: 'error',
    title: 'Integration Error',
    message: 'Failed to connect to third-party verification service. (Mock error)',
    read: false,
    metadata: { errorCode: 'MOCK_ERROR_001', retryable: true },
    createdAt: '2026-02-01T12:00:00.000Z',
  },
];

/**
 * Find mock notifications for a user
 */
export function findMockNotificationsForUser(
  userId: string,
  userType: 'user' | 'candidate'
): MockNotification[] {
  return mockNotifications.filter(
    (n) => n.userId === userId && n.userType === userType
  );
}

/**
 * Find mock notification by ID
 */
export function findMockNotificationById(id: string): MockNotification | undefined {
  return mockNotifications.find((n) => n.id === id);
}

/**
 * Get unread notification count for a user
 */
export function getMockUnreadCount(userId: string, userType: 'user' | 'candidate'): number {
  return mockNotifications.filter(
    (n) => n.userId === userId && n.userType === userType && !n.read
  ).length;
}
