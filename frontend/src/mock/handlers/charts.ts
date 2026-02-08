/**
 * Reports/Charts endpoint mock handlers.
 */
import type MockAdapter from 'axios-mock-adapter';
import {
  screeningOverviewResponse,
  savedChartsResponse,
  screeningReportResponse,
} from '../fixtures/charts';

/**
 * Registers chart endpoint handlers on the mock adapter.
 * @param mock - The axios mock adapter instance
 */
export function registerChartHandlers(mock: MockAdapter): void {
  // GET /api/v1/charts/screening-overview
  mock.onGet('/api/v1/charts/screening-overview').reply(200, screeningOverviewResponse);

  // GET /api/v1/charts/saved
  mock.onGet('/api/v1/charts/saved').reply(200, savedChartsResponse);

  // GET /api/v1/client/reports
  mock.onGet('/api/v1/client/reports').reply(200, screeningReportResponse);
}
