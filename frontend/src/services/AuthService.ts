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

/** Backend sign-in response (flat structure per shared contract). */
interface BackendSignInResponse {
  requiresMfa?: boolean;
  mfaSessionToken?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
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
   * Transforms backend response to frontend SignInResponse format.
   * @returns SignInResponse which may require MFA.
   * @throws {ApiErrorEnvelope} On authentication failure
   */
  async signIn(credentials: SignInCredentials): Promise<SignInResponse> {
    const client = createClient();
    try {
      console.log('[AuthService] Starting sign-in request');
      const response = await client.post<BackendSignInResponse>('/sign-in', credentials);
      const data = response.data;
      console.log('[AuthService] Sign-in response:', { hasAccessToken: !!data.accessToken, hasRefreshToken: !!data.refreshToken, expiresIn: data.expiresIn, requiresMfa: data.requiresMfa });

      // MFA required
      if (data.requiresMfa && data.mfaSessionToken) {
        console.log('[AuthService] MFA required');
        return {
          requiresMfa: true,
          mfaToken: data.mfaSessionToken,
        };
      }

      // Successful authentication - fetch user and construct session
      if (data.accessToken && data.refreshToken && data.expiresIn !== undefined) {
        console.log('[AuthService] Fetching user via /me');
        const userResponse = await client.get<{ id: string; email: string; firstName?: string; lastName?: string; role: string; userType: string; mfaEnabled: boolean; tenantId?: string; createdAt: string; updatedAt: string }>('/me', {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        });
        const userData = userResponse.data;
        console.log('[AuthService] Got user data:', userData);

        const user = {
          id: userData.id,
          email: userData.email,
          roles: [userData.role as 'admin' | 'manager' | 'agent' | 'viewer'],
          type: userData.userType as 'user' | 'candidate',
          mfaEnabled: userData.mfaEnabled,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
          ...(userData.firstName ? { firstName: userData.firstName } : {}),
          ...(userData.lastName ? { lastName: userData.lastName } : {}),
          ...(userData.tenantId ? { tenantId: userData.tenantId } : {}),
          ...(userData.firstName && userData.lastName
            ? { displayName: `${userData.firstName} ${userData.lastName}` }
            : {}),
        };

        console.log('[AuthService] Returning session with user:', user);
        return {
          requiresMfa: false,
          session: {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt: Date.now() + data.expiresIn * 1000,
            user,
          },
        };
      }

      // Unexpected response
      console.log('[AuthService] Unexpected response - no token or MFA');
      return { requiresMfa: false };
    } catch (err) {
      console.error('[AuthService] SignIn error:', err);
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
   * Transforms the flat backend response into a full AuthSession by fetching user data.
   * @returns The new session with updated tokens and user profile.
   * @throws {ApiErrorEnvelope} On refresh failure (e.g., token expired)
   */
  async refreshToken(refreshToken: string): Promise<AuthSession> {
    const client = createClient();
    try {
      const response = await client.post<BackendSignInResponse>('/refresh', { refreshToken });
      const data = response.data;

      if (!data.accessToken || !data.refreshToken || data.expiresIn === undefined) {
        throw new Error('Invalid refresh response');
      }

      // Fetch user profile with the new access token
      const userResponse = await client.get<{
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: string;
        userType: string;
        mfaEnabled: boolean;
        tenantId?: string;
        createdAt: string;
        updatedAt: string;
      }>('/me', {
        headers: { Authorization: `Bearer ${data.accessToken}` },
      });
      const userData = userResponse.data;

      const user = {
        id: userData.id,
        email: userData.email,
        roles: [userData.role as 'admin' | 'manager' | 'agent' | 'viewer'],
        type: userData.userType as 'user' | 'candidate',
        mfaEnabled: userData.mfaEnabled,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        ...(userData.firstName ? { firstName: userData.firstName } : {}),
        ...(userData.lastName ? { lastName: userData.lastName } : {}),
        ...(userData.tenantId ? { tenantId: userData.tenantId } : {}),
        ...(userData.firstName && userData.lastName
          ? { displayName: `${userData.firstName} ${userData.lastName}` }
          : {}),
      };

      return {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: Date.now() + data.expiresIn * 1000,
        user,
      };
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
