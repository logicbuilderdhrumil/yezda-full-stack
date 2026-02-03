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
  AuthError,
} from '@/@types/auth';

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

/** Extracts a structured error from an axios error response. */
function extractError(err: unknown): AuthError {
  if (axios.isAxiosError<Partial<AuthError>>(err)) {
    const data = err.response?.data;
    if (data) {
      return {
        code: data.code ?? 'AUTH_ERROR',
        message: data.message ?? 'An unexpected error occurred',
        ...(data.field !== undefined ? { field: data.field } : {}),
      };
    }
  }
  return {
    code: 'NETWORK_ERROR',
    message: 'Unable to connect to the server',
  };
}

/**
 * AuthService encapsulates all authentication-related API calls.
 */
export const AuthService = {
  /**
   * Sign in with email and password.
   * @returns SignInResponse which may require MFA.
   */
  async signIn(credentials: SignInCredentials): Promise<SignInResponse> {
    const client = createClient();
    try {
      const response = await client.post<SignInResponse>('/sign-in', credentials);
      return response.data;
    } catch (err) {
      throw extractError(err);
    }
  },

  /**
   * Sign up a new user account.
   * @returns The created session.
   */
  async signUp(credentials: SignUpCredentials): Promise<AuthSession> {
    const client = createClient();
    try {
      const response = await client.post<AuthSession>('/sign-up', credentials);
      return response.data;
    } catch (err) {
      throw extractError(err);
    }
  },

  /**
   * Request a password reset link.
   */
  async requestPasswordReset(payload: PasswordResetRequest): Promise<void> {
    const client = createClient();
    try {
      await client.post('/forgot-password', payload);
    } catch (err) {
      throw extractError(err);
    }
  },

  /**
   * Complete password reset with token and new password.
   */
  async resetPassword(payload: PasswordResetPayload): Promise<void> {
    const client = createClient();
    try {
      await client.post('/reset-password', payload);
    } catch (err) {
      throw extractError(err);
    }
  },

  /**
   * Complete candidate password reset with token, candidateId, and new password.
   */
  async resetCandidatePassword(payload: CandidatePasswordResetPayload): Promise<void> {
    const client = createClient();
    try {
      await client.post('/candidate-reset-password', payload);
    } catch (err) {
      throw extractError(err);
    }
  },

  /**
   * Verify TOTP code for MFA.
   * @returns The authenticated session after successful verification.
   */
  async verifyTotp(payload: TotpVerifyPayload): Promise<AuthSession> {
    const client = createClient();
    try {
      const response = await client.post<AuthSession>('/verify-totp', payload);
      return response.data;
    } catch (err) {
      throw extractError(err);
    }
  },

  /**
   * Sign out the current user.
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
   */
  async refreshToken(refreshToken: string): Promise<AuthSession> {
    const client = createClient();
    try {
      const response = await client.post<AuthSession>('/refresh', { refreshToken });
      return response.data;
    } catch (err) {
      throw extractError(err);
    }
  },

  /**
   * Get the current user from the server.
   * Used to validate an existing session on app load.
   * @param accessToken The access token to validate.
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
      throw extractError(err);
    }
  },
};
