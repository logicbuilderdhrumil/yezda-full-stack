/**
 * Mock Fixtures Index
 * Central export for all fixture data used in mock API mode.
 */

export * from './auth.fixtures.js';
export * from './users.fixtures.js';
export * from './notifications.fixtures.js';
export * from './state-store.fixtures.js';
export * from './shell.fixtures.js';

/**
 * Fixture metadata for audit logging
 */
export interface FixtureMetadata {
  name: string;
  description: string;
  lastUpdated: string;
  recordCount: number;
}

/**
 * Get metadata about all available fixtures
 */
export function getFixtureManifest(): Record<string, FixtureMetadata> {
  return {
    auth: {
      name: 'auth',
      description: 'Authentication fixtures (users, tokens)',
      lastUpdated: '2026-02-03',
      recordCount: 3,
    },
    users: {
      name: 'users',
      description: 'User profile fixtures',
      lastUpdated: '2026-02-03',
      recordCount: 3,
    },
    notifications: {
      name: 'notifications',
      description: 'Notification fixtures',
      lastUpdated: '2026-02-03',
      recordCount: 5,
    },
    stateStore: {
      name: 'stateStore',
      description: 'State store fixtures',
      lastUpdated: '2026-02-03',
      recordCount: 2,
    },
    shell: {
      name: 'shell',
      description: 'Shell configuration fixtures',
      lastUpdated: '2026-02-03',
      recordCount: 1,
    },
  };
}
