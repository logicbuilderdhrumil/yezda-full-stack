/**
 * Account/Settings endpoint mock handlers.
 */
import type MockAdapter from 'axios-mock-adapter';
import {
  accountProfileResponse,
  integrationsResponse,
} from '../fixtures/account';

/**
 * Registers account endpoint handlers on the mock adapter.
 * @param mock - The axios mock adapter instance
 */
export function registerAccountHandlers(mock: MockAdapter): void {
  // GET /api/v1/account/profile
  mock.onGet('/api/v1/account/profile').reply(200, accountProfileResponse);

  // GET /api/v1/account/integrations
  mock.onGet('/api/v1/account/integrations').reply(200, integrationsResponse);
}
