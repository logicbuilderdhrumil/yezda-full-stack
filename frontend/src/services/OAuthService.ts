/**
 * OAuth Integration Service
 * Task 1.1: Frontend service for OAuth API calls
 */
import axios, { type AxiosInstance } from 'axios';
import type {
  OAuthProvider,
  OAuthAuthorizeResponse,
  IntegrationStatus,
  OAuthCallbackResult,
  OAuthError,
} from '@/@types/oauth';

const API_BASE = '/api/v1/oauth';

/** Creates axios instance for OAuth API calls */
function createClient(): AxiosInstance {
  return axios.create({
    baseURL: API_BASE,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
}

/** Extracts structured error from axios error response */
function extractError(err: unknown): OAuthError {
  if (axios.isAxiosError<Partial<OAuthError>>(err)) {
    const data = err.response?.data;
    if (data) {
      return {
        code: data.code ?? 'OAUTH_ERROR',
        message: data.message ?? 'An unexpected error occurred',
        ...(data.provider !== undefined ? { provider: data.provider } : {}),
      };
    }
  }
  return {
    code: 'NETWORK_ERROR',
    message: 'Unable to connect to the server',
  };
}

/**
 * OAuthService encapsulates all OAuth-related API calls.
 */
export const OAuthService = {
  /**
   * Get list of available OAuth providers.
   */
  async getProviders(): Promise<OAuthProvider[]> {
    const client = createClient();
    try {
      const response = await client.get<{ providers: OAuthProvider[] }>('/providers');
      return response.data.providers;
    } catch (err) {
      throw extractError(err);
    }
  },

  /**
   * Start OAuth authorization flow for a provider.
   * Returns the authorization URL to redirect the user to.
   * @param provider The OAuth provider to authorize with.
   * @param redirectUrl Optional URL to redirect after OAuth completion.
   */
  async authorize(
    provider: OAuthProvider,
    redirectUrl?: string
  ): Promise<OAuthAuthorizeResponse> {
    const client = createClient();
    try {
      const response = await client.post<OAuthAuthorizeResponse>(
        `/authorize/${provider}`,
        { redirectUrl }
      );
      return response.data;
    } catch (err) {
      throw extractError(err);
    }
  },

  /**
   * Get integration status for a specific provider.
   * @param provider The OAuth provider to check.
   */
  async getStatus(provider: OAuthProvider): Promise<IntegrationStatus> {
    const client = createClient();
    try {
      const response = await client.get<IntegrationStatus>(`/status/${provider}`);
      return response.data;
    } catch (err) {
      throw extractError(err);
    }
  },

  /**
   * Get all integration statuses.
   */
  async getAllStatuses(): Promise<IntegrationStatus[]> {
    const client = createClient();
    try {
      const response = await client.get<{ integrations: IntegrationStatus[] }>('/status');
      return response.data.integrations;
    } catch (err) {
      throw extractError(err);
    }
  },

  /**
   * Disconnect an integration.
   * @param provider The OAuth provider to disconnect.
   */
  async disconnect(provider: OAuthProvider): Promise<void> {
    const client = createClient();
    try {
      await client.delete(`/integration/${provider}`);
    } catch (err) {
      throw extractError(err);
    }
  },

  /**
   * Manually refresh an integration token.
   * @param provider The OAuth provider to refresh.
   */
  async refreshToken(provider: OAuthProvider): Promise<IntegrationStatus> {
    const client = createClient();
    try {
      const response = await client.post<IntegrationStatus>(`/refresh/${provider}`);
      return response.data;
    } catch (err) {
      throw extractError(err);
    }
  },

  /**
   * Parse OAuth callback URL parameters.
   * @param searchParams URL search params from callback.
   */
  parseCallbackParams(searchParams: URLSearchParams): OAuthCallbackResult {
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    const success = searchParams.get('success');
    const provider = searchParams.get('provider') as OAuthProvider | null;

    if (error) {
      return {
        success: false,
        error: errorDescription ?? error,
        errorCode: error,
        provider: provider ?? undefined,
      };
    }

    if (success === 'true') {
      return {
        success: true,
        provider: provider ?? undefined,
        redirectUrl: searchParams.get('redirect') ?? undefined,
      };
    }

    // Fallback: check for code param (direct callback)
    const code = searchParams.get('code');
    if (code) {
      return {
        success: true,
        provider: provider ?? undefined,
      };
    }

    return {
      success: false,
      error: 'Unknown callback state',
      errorCode: 'UNKNOWN_STATE',
    };
  },
};
