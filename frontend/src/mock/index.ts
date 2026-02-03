/**
 * Mock API module.
 * Provides mock API responses for local development.
 *
 * @example
 * ```typescript
 * // In your app initialization:
 * import { setupMockAdapter, isMockEnabled } from '@/mock';
 * import { apiClient } from '@/services';
 *
 * if (isMockEnabled()) {
 *   setupMockAdapter(apiClient);
 * }
 * ```
 */
export {
  setupMockAdapter,
  getMockAdapter,
  resetMockAdapter,
  resetMockHandlers,
} from './adapter';

export {
  getMockConfig,
  setMockConfig,
  resetMockConfig,
  isMockEnabled,
  type MockConfig,
} from './config';

// Re-export fixtures for direct access in tests
export * as fixtures from './fixtures';
