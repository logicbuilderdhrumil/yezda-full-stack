/**
 * Auth endpoint mock handlers.
 */
import type MockAdapter from 'axios-mock-adapter';
import {
  signInResponse,
  signUpResponse,
  forgotPasswordResponse,
  resetPasswordResponse,
  verifyTotpResponse,
  refreshResponse,
  meResponse,
} from '../fixtures/auth';

/**
 * Registers auth endpoint handlers on the mock adapter.
 * @param mock - The axios mock adapter instance
 */
export function registerAuthHandlers(mock: MockAdapter): void {
  // POST /api/v1/auth/sign-in
  mock.onPost('/api/v1/auth/sign-in').reply(200, signInResponse);

  // POST /api/v1/auth/sign-up
  mock.onPost('/api/v1/auth/sign-up').reply(201, signUpResponse);

  // POST /api/v1/auth/sign-out
  mock.onPost('/api/v1/auth/sign-out').reply(200, { message: 'Signed out successfully.' });

  // POST /api/v1/auth/password/reset-request
  mock.onPost('/api/v1/auth/password/reset-request').reply(200, forgotPasswordResponse);

  // POST /api/v1/auth/password/reset-complete
  mock.onPost('/api/v1/auth/password/reset-complete').reply(200, resetPasswordResponse);

  // POST /api/v1/auth/candidate-reset-password
  mock.onPost('/api/v1/auth/candidate-reset-password').reply(200, resetPasswordResponse);

  // POST /api/v1/auth/mfa/verify
  mock.onPost('/api/v1/auth/mfa/verify').reply(200, verifyTotpResponse);

  // POST /api/v1/auth/refresh
  mock.onPost('/api/v1/auth/refresh').reply(200, refreshResponse);

  // GET /api/v1/auth/me
  mock.onGet('/api/v1/auth/me').reply(200, meResponse);
}
