import axios, { type AxiosInstance } from 'axios';
import type {
  AuthSession,
  SignInCredentials,
  SignUpCredentials,
  SignInResponse,
  PasswordResetRequest,
  PasswordResetPayload,
  CandidatePasswordResetPayload,
  TotpVerifyPayload,
} from '@/@types/auth';
import { extractApiError } from '@/@types/api-error';
import type { ApiErrorEnvelope } from '@/@types/api-error';

const API_BASE = '/api/v1/auth';

/** Creates an axios instance for auth API calls. */
function createClient(): AxiosInstance {
  return axios.create({
    baseURL: API_BASE,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
}

/**
 * AuthService encapsulates all authentication-related API calls.
 * Error responses conform to the ApiErrorEnvelope contract.
 *
 * @see shared/src/contracts/auth.ts for request/response types
 * @see shared/src/contracts/error-envelope.ts for error format
 */
export const AuthService = {
  /**
   * Sign in with email and password.
   * @returns SignInResponse which may require MFA.
   * @throws {ApiErrorEnvelope} On authentication failure
   */
  async signIn(credentials: SignInCredentials): Promise<SignInResponse> {
    const client = createClient();
    try {
      const response = await client.post<SignInResponse>('/sign-in', credentials);
      return response.data;
    } catch (err) {
      throw extractApiError(err);
    }
  },

  /**
   * Sign up a new user account.
   * @returns The created session.
   * @throws {ApiErrorEnvelope} On validation or registration failure
   */
  async signUp(credentials: SignUpCredentials): Promise<AuthSession> {
    const client = createClient();
    try {
      const response = await client.post<AuthSession>('/sign-up', credentials);
      return response.data;
    } catch (err) {
      throw extractApiError(err);
    }
  },

  /**
   * Request a password reset link.
   * @throws {ApiErrorEnvelope} On request failure
   */
  async requestPasswordReset(payload: PasswordResetRequest): Promise<void> {
    const client = createClient();
    try {
      await client.post('/password/reset-request', payload);
    } catch (err) {
      throw extractApiError(err);
    }
  },

  /**
   * Complete password reset with token and new password.
   * @throws {ApiErrorEnvelope} On reset failure
   */
  async resetPassword(payload: PasswordResetPayload): Promise<void> {
    const client = createClient();
    try {
      await client.post('/password/reset-complete', payload);
    } catch (err) {
      throw extractApiError(err);
    }
  },

  /**
   * Complete candidate password reset with token, candidateId, and new password.
   * @throws {ApiErrorEnvelope} On reset failure
   */
  async resetCandidatePassword(payload: CandidatePasswordResetPayload): Promise<void> {
    const client = createClient();
    try {
      await client.post('/candidate-reset-password', payload);
    } catch (err) {
      throw extractApiError(err);
    }
  },

  /**
   * Verify TOTP code for MFA.
   * @returns The authenticated session after successful verification.
   * @throws {ApiErrorEnvelope} On MFA verification failure
   */
  async verifyTotp(payload: TotpVerifyPayload): Promise<AuthSession> {
    const client = createClient();
    try {
      const response = await client.post<AuthSession>('/mfa/verify', payload);
      return response.data;
    } catch (err) {
      throw extractApiError(err);
    }
  },

  /**
   * Sign out the current user.
   * Ignores errors as local state should be cleared regardless.
   */
  async signOut(): Promise<void> {
    const client = createClient();
    try {
      await client.post('/sign-out');
    } catch {
      // Ignore errors on sign-out; clear local state anyway
    }
  },

  /**
   * Refresh the access token using the refresh token.
   * @returns The new session with updated tokens.
   * @throws {ApiErrorEnvelope} On refresh failure (e.g., token expired)
   */
  async refreshToken(refreshToken: string): Promise<AuthSession> {
    const client = createClient();
    try {
      const response = await client.post<AuthSession>('/refresh', { refreshToken });
      return response.data;
    } catch (err) {
      throw extractApiError(err);
    }
  },

  /**
   * Get the current user from the server.
   * Used to validate an existing session on app load.
   * @param accessToken The access token to validate.
   * @throws {ApiErrorEnvelope} On authentication failure
   */
  async getCurrentUser(accessToken: string): Promise<AuthSession> {
    const client = createClient();
    try {
      const response = await client.get<AuthSession>('/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      return response.data;
    } catch (err) {
      throw extractApiError(err);
    }
  },
};

/** Re-export error type for consumers */
export type { ApiErrorEnvelope };
