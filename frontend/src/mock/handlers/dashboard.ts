/**
 * Dashboard endpoint mock handlers.
 */
import type MockAdapter from 'axios-mock-adapter';
import {
  dashboardSummaryResponse,
  dashboardTrendsResponse,
  dashboardActivityResponse,
  widgetsResponse,
} from '../fixtures/dashboard';

/**
 * Registers dashboard endpoint handlers on the mock adapter.
 * @param mock - The axios mock adapter instance
 */
export function registerDashboardHandlers(mock: MockAdapter): void {
  // GET /api/v1/dashboard/summary
  mock.onGet('/api/v1/dashboard/summary').reply(200, dashboardSummaryResponse);

  // GET /api/v1/dashboard/trends
  mock.onGet('/api/v1/dashboard/trends').reply(200, dashboardTrendsResponse);

  // GET /api/v1/dashboard/activity
  mock.onGet('/api/v1/dashboard/activity').reply(200, dashboardActivityResponse);

  // GET /api/v1/widgets
  mock.onGet('/api/v1/widgets').reply(200, widgetsResponse);
}
