/**
 * Account/Settings module mock fixtures.
 * Provides fake data for account profile and integrations endpoints.
 */

/** Mock account profile. */
export const accountProfileResponse = {
  id: 'user-001',
  email: 'demo@example.com',
  firstName: 'Demo',
  lastName: 'User',
  displayName: 'Demo User',
  avatarUrl: null,
  phone: '+44 7700 900123',
  timezone: 'Europe/London',
  language: 'en',
  role: 'platform_admin',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2026-02-01T12:00:00.000Z',
};

/** Mock integration provider. */
export interface MockIntegration {
  provider: string;
  connected: boolean;
  lastSyncAt: string | null;
}

/** Predefined mock integrations. */
export const mockIntegrations: MockIntegration[] = [
  {
    provider: 'google',
    connected: true,
    lastSyncAt: '2026-02-07T22:00:00.000Z',
  },
  {
    provider: 'microsoft',
    connected: false,
    lastSyncAt: null,
  },
  {
    provider: 'slack',
    connected: true,
    lastSyncAt: '2026-02-08T06:30:00.000Z',
  },
];

/** Mock integrations list response. */
export const integrationsResponse = {
  integrations: mockIntegrations,
};
