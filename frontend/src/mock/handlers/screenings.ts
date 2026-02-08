/**
 * Screenings endpoint mock handlers.
 * Registers handlers for client portal screening list endpoints.
 */
import type MockAdapter from 'axios-mock-adapter';
import { screeningsListResponse } from '../fixtures/screenings';

/**
 * Registers screening endpoint handlers on the mock adapter.
 * @param mock - The axios mock adapter instance
 */
export function registerScreeningHandlers(mock: MockAdapter): void {
  // GET /api/v1/client/screenings (with optional query params)
  mock.onGet(/\/api\/v1\/client\/screenings(\?.*)?$/).reply(200, screeningsListResponse);
}
