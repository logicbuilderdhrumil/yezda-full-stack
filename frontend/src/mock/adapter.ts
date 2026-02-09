/**
 * Mock API adapter setup.
 * Provides a mock adapter layer for local development without backend dependencies.
 */
import MockAdapter from 'axios-mock-adapter';
import type { AxiosInstance } from 'axios';
import { getMockConfig, isMockEnabled } from './config';
import { registerAuthHandlers } from './handlers/auth';
import { registerUserHandlers } from './handlers/users';
import { registerCandidateHandlers } from './handlers/candidates';
import { registerDashboardHandlers } from './handlers/dashboard';
import { registerNotificationHandlers } from './handlers/notifications';
import { registerOrganizationHandlers } from './handlers/organizations';
import { registerPipelineHandlers } from './handlers/pipelines';
import { registerReviewHandlers } from './handlers/reviews';
import { registerChatHandlers } from './handlers/chat';
import { registerLedgerHandlers } from './handlers/ledger';
import { registerFormHandlers } from './handlers/forms';
import { registerAccountHandlers } from './handlers/account';
import { registerChartHandlers } from './handlers/charts';
import { registerScreeningHandlers } from './handlers/screenings';

/** Active mock adapter instance. */
let mockInstance: MockAdapter | null = null;

/**
 * Initializes the mock API adapter on the given Axios instance.
 * Only activates if mock mode is enabled in configuration.
 *
 * @param axiosInstance - The Axios instance to mock
 * @returns The mock adapter instance (or null if mock mode is disabled)
 */
export function setupMockAdapter(axiosInstance: AxiosInstance): MockAdapter | null {
  if (!isMockEnabled()) {
    return null;
  }

  const config = getMockConfig();

  // Create mock adapter with delay simulation
  mockInstance = new MockAdapter(axiosInstance, {
    delayResponse: config.latencyMs,
    onNoMatch: 'passthrough', // Allow unmocked requests to pass through
  });

  // Register all endpoint handlers
  registerAuthHandlers(mockInstance);
  registerUserHandlers(mockInstance);
  registerCandidateHandlers(mockInstance);
  registerDashboardHandlers(mockInstance);
  registerNotificationHandlers(mockInstance);
  registerOrganizationHandlers(mockInstance);
  registerPipelineHandlers(mockInstance);
  registerReviewHandlers(mockInstance);
  registerChatHandlers(mockInstance);
  registerLedgerHandlers(mockInstance);
  registerFormHandlers(mockInstance);
  registerAccountHandlers(mockInstance);
  registerChartHandlers(mockInstance);
  registerScreeningHandlers(mockInstance);

  if (config.logRequests) {
    console.log('[MockAPI] Mock adapter initialized with latency:', config.latencyMs, 'ms');
  }

  return mockInstance;
}

/**
 * Gets the current mock adapter instance.
 * @returns The mock adapter instance or null if not initialized
 */
export function getMockAdapter(): MockAdapter | null {
  return mockInstance;
}

/**
 * Resets the mock adapter, clearing all handlers.
 * Call this to restore the original Axios behavior.
 */
export function resetMockAdapter(): void {
  if (mockInstance) {
    mockInstance.restore();
    mockInstance = null;
    if (getMockConfig().logRequests) {
      console.log('[MockAPI] Mock adapter reset');
    }
  }
}

/**
 * Resets request history and handlers but keeps the adapter attached.
 * Useful for cleaning up between tests.
 */
export function resetMockHandlers(): void {
  if (mockInstance) {
    mockInstance.reset();
    // Re-register handlers after reset
    registerAuthHandlers(mockInstance);
    registerUserHandlers(mockInstance);
    registerCandidateHandlers(mockInstance);
    registerDashboardHandlers(mockInstance);
    registerNotificationHandlers(mockInstance);
    registerOrganizationHandlers(mockInstance);
    registerPipelineHandlers(mockInstance);
    registerReviewHandlers(mockInstance);
    registerChatHandlers(mockInstance);
    registerLedgerHandlers(mockInstance);
    registerFormHandlers(mockInstance);
    registerAccountHandlers(mockInstance);
    registerChartHandlers(mockInstance);
    registerScreeningHandlers(mockInstance);
  }
}
