import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { extractApiError, ErrorCodes } from '@/utils/errorHandler';

/** Type for the token getter function. */
export type TokenGetter = () => string | null;

/** Type for the token refresh function. */
export type TokenRefresher = () => Promise<string | null>;

/** Interceptor configuration options. */
export interface InterceptorConfig {
  /** Function to get the current access token */
  getAccessToken?: TokenGetter;
  /** Function to refresh the token when expired */
  refreshToken?: TokenRefresher;
  /** Locale getter for Accept-Language header */
  getLocale?: () => string;
  /** Callback when auth fails (e.g., redirect to login) */
  onAuthFailure?: () => void;
}

/** Pending request queue for token refresh. */
interface QueuedRequest {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}

/**
 * Sets up request interceptors on an Axios instance.
 * Adds authentication headers and locale.
 */
export function setupRequestInterceptors(
  instance: AxiosInstance,
  config: InterceptorConfig
): void {
  instance.interceptors.request.use(
    (requestConfig: InternalAxiosRequestConfig) => {
      // Add auth token if available
      if (config.getAccessToken) {
        const token = config.getAccessToken();
        if (token) {
          requestConfig.headers.Authorization = `Bearer ${token}`;
        }
      }

      // Add locale header
      if (config.getLocale) {
        const locale = config.getLocale();
        requestConfig.headers['Accept-Language'] = locale;
      }

      return requestConfig;
    },
    (error: AxiosError) => {
      return Promise.reject(extractApiError(error));
    }
  );
}

/**
 * Sets up response interceptors on an Axios instance.
 * Handles error mapping and token refresh.
 * State is encapsulated per-instance to avoid singleton coupling.
 */
export function setupResponseInterceptors(
  instance: AxiosInstance,
  config: InterceptorConfig
): void {
  // Encapsulated state per instance to avoid shared mutable state
  let isRefreshing = false;
  const refreshQueue: QueuedRequest[] = [];

  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config;

      // Handle 401 with token refresh
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._isRetry &&
        config.refreshToken
      ) {
        if (isRefreshing) {
          // Queue this request until refresh completes
          return new Promise<string | null>((resolve, reject) => {
            refreshQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (token && originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return instance(originalRequest);
            })
            .catch((err) => Promise.reject(extractApiError(err)));
        }

        originalRequest._isRetry = true;
        isRefreshing = true;

        try {
          const newToken = await config.refreshToken();

          // Process queued requests
          refreshQueue.forEach((req) => req.resolve(newToken));
          refreshQueue.length = 0;

          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return instance(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed - reject queued requests
          refreshQueue.forEach((req) => req.reject(refreshError));
          refreshQueue.length = 0;

          // Notify of auth failure
          if (config.onAuthFailure) {
            config.onAuthFailure();
          }

          return Promise.reject(extractApiError(refreshError));
        } finally {
          isRefreshing = false;
        }
      }

      // Handle auth failure callback for 401/403
      if (
        (error.response?.status === 401 || error.response?.status === 403) &&
        config.onAuthFailure
      ) {
        const apiError = extractApiError(error);
        if (apiError.code === ErrorCodes.UNAUTHORIZED) {
          config.onAuthFailure();
        }
      }

      return Promise.reject(extractApiError(error));
    }
  );
}

/**
 * Sets up all interceptors on an Axios instance.
 */
export function setupInterceptors(
  instance: AxiosInstance,
  config: InterceptorConfig
): void {
  setupRequestInterceptors(instance, config);
  setupResponseInterceptors(instance, config);
}

// Extend Axios types to support retry flag
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _isRetry?: boolean;
  }
}
