import axios, { type AxiosInstance, type CreateAxiosDefaults } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { setupInterceptors } from './interceptors';

/**
 * Default Axios configuration.
 * Note: baseURL is '/' because endpoint resolution already adds the /api/v1 prefix.
 */
const defaultConfig: CreateAxiosDefaults = {
  baseURL: '/',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
};

/**
 * Creates a configured Axios instance.
 * @param config Optional configuration overrides
 * @returns Configured Axios instance
 */
export function createAxiosInstance(config?: CreateAxiosDefaults): AxiosInstance {
  return axios.create({
    ...defaultConfig,
    ...config,
    headers: {
      ...defaultConfig.headers,
      ...config?.headers,
    },
  });
}

/**
 * The default shared Axios instance for API calls.
 */
export const apiClient = createAxiosInstance();

// Wire up interceptors with auth store integration
setupInterceptors(apiClient, {
  getAccessToken: () => useAuthStore.getState().getAccessToken(),
  refreshToken: async () => {
    const refreshToken = useAuthStore.getState().getRefreshToken();
    if (!refreshToken) return null;
    // Dynamic import to avoid circular dependency
    const { AuthService } = await import('@/services/AuthService');
    try {
      const session = await AuthService.refreshToken(refreshToken);
      useAuthStore.getState().setSession(session);
      return session.accessToken;
    } catch {
      return null;
    }
  },
  onAuthFailure: () => {
    useAuthStore.getState().clearSession();
    // Navigate to sign-in (use location.replace to avoid history issues)
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/sign-in')) {
      window.location.replace('/sign-in');
    }
  },
});
