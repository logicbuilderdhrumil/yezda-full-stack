/**
 * Ledger endpoint mock handlers.
 */
import type MockAdapter from 'axios-mock-adapter';
import { ledgerListResponse } from '../fixtures/ledger';

/**
 * Registers ledger endpoint handlers on the mock adapter.
 * @param mock - The axios mock adapter instance
 */
export function registerLedgerHandlers(mock: MockAdapter): void {
  // GET /api/v1/ledger
  mock.onGet('/api/v1/ledger').reply(200, ledgerListResponse);
}
