import type { AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios';
import axios from 'axios';
import { apiClient, setupInterceptors, type InterceptorConfig } from './axios';
import { endpoints, resolveEndpoint, type EndpointName } from '@/configs/endpoint.config';

/** Request configuration options for ApiService methods. */
export interface RequestOptions<TParams = Record<string, string>> extends Omit<AxiosRequestConfig, 'url' | 'method' | 'data'> {
  /** Path parameters for endpoint resolution (e.g., { id: '123' }) */
  pathParams?: TParams;
  /** Abort signal for request cancellation */
  signal?: AbortSignal;
}

/** Response type from ApiService methods. */
export type ApiResponse<T> = AxiosResponse<T>;

/** Token getter type for initialization. */
export type TokenGetter = () => string | null;

/** Token refresher type for initialization. */
export type TokenRefresher = () => Promise<string | null>;

/**
 * Initializes the ApiService with authentication hooks.
 * Should be called once during app bootstrap.
 */
export function initializeApiService(config: InterceptorConfig): void {
  setupInterceptors(apiClient, config);
}

/**
 * Creates an AbortController for request cancellation.
 * @returns An object with the AbortController and its signal
 */
export function createAbortController(): {
  controller: AbortController;
  signal: AbortSignal;
} {
  const controller = new AbortController();
  return {
    controller,
    signal: controller.signal,
  };
}

/**
 * Creates a CancelToken source for legacy cancellation support.
 * @deprecated Use AbortController instead
 * @returns Axios CancelTokenSource
 */
export function createCancelToken(): CancelTokenSource {
  return axios.CancelToken.source();
}

/**
 * Checks if an error was caused by request cancellation.
 * @param error - The error to check
 * @returns True if the request was cancelled
 */
export function isRequestCancelled(error: unknown): boolean {
  return axios.isCancel(error);
}

/**
 * ApiService provides a typed wrapper around the shared Axios instance.
 * Use this for all API calls instead of direct axios usage.
 */
export const ApiService = {
  /**
   * Performs a GET request.
   * @param endpoint - The endpoint name from the config, or a raw URL path
   * @param options - Request options including path parameters
   * @returns Promise resolving to the full Axios response
   */
  async get<T, TParams extends Record<string, string> = Record<string, string>>(
    endpoint: EndpointName | string,
    options?: RequestOptions<TParams>
  ): Promise<ApiResponse<T>> {
    const url = resolveUrl(endpoint, options?.pathParams);
    const config = buildConfig(options);
    return apiClient.get<T>(url, config);
  },

  /**
   * Performs a POST request.
   * @param endpoint - The endpoint name from the config, or a raw URL path
   * @param data - Request body
   * @param options - Request options including path parameters
   * @returns Promise resolving to the full Axios response
   */
  async post<T, D = unknown, TParams extends Record<string, string> = Record<string, string>>(
    endpoint: EndpointName | string,
    data?: D,
    options?: RequestOptions<TParams>
  ): Promise<ApiResponse<T>> {
    const url = resolveUrl(endpoint, options?.pathParams);
    const config = buildConfig(options);
    return apiClient.post<T>(url, data, config);
  },

  /**
   * Performs a PUT request.
   * @param endpoint - The endpoint name from the config, or a raw URL path
   * @param data - Request body
   * @param options - Request options including path parameters
   * @returns Promise resolving to the full Axios response
   */
  async put<T, D = unknown, TParams extends Record<string, string> = Record<string, string>>(
    endpoint: EndpointName | string,
    data?: D,
    options?: RequestOptions<TParams>
  ): Promise<ApiResponse<T>> {
    const url = resolveUrl(endpoint, options?.pathParams);
    const config = buildConfig(options);
    return apiClient.put<T>(url, data, config);
  },

  /**
   * Performs a PATCH request.
   * @param endpoint - The endpoint name from the config, or a raw URL path
   * @param data - Request body
   * @param options - Request options including path parameters
   * @returns Promise resolving to the full Axios response
   */
  async patch<T, D = unknown, TParams extends Record<string, string> = Record<string, string>>(
    endpoint: EndpointName | string,
    data?: D,
    options?: RequestOptions<TParams>
  ): Promise<ApiResponse<T>> {
    const url = resolveUrl(endpoint, options?.pathParams);
    const config = buildConfig(options);
    return apiClient.patch<T>(url, data, config);
  },

  /**
   * Performs a DELETE request.
   * @param endpoint - The endpoint name from the config, or a raw URL path
   * @param options - Request options including path parameters
   * @returns Promise resolving to the full Axios response
   */
  async delete<T, TParams extends Record<string, string> = Record<string, string>>(
    endpoint: EndpointName | string,
    options?: RequestOptions<TParams>
  ): Promise<ApiResponse<T>> {
    const url = resolveUrl(endpoint, options?.pathParams);
    const config = buildConfig(options);
    return apiClient.delete<T>(url, config);
  },

  /**
   * Performs a request with custom configuration.
   * Use this for non-standard requests or when you need full control.
   * @param config - Full Axios request configuration
   * @returns Promise resolving to the response
   */
  async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return apiClient.request<T>(config);
  },
};

/**
 * Resolves the URL from an endpoint name or raw path.
 */
function resolveUrl(
  endpoint: EndpointName | string,
  pathParams?: Record<string, string>
): string {
  // Check if it's a known endpoint name (own-property only)
  if (Object.prototype.hasOwnProperty.call(endpoints, endpoint)) {
    return resolveEndpoint(endpoint as EndpointName, pathParams);
  }

  // Treat as raw URL
  if (pathParams) {
    let url = endpoint;
    for (const [key, value] of Object.entries(pathParams)) {
      url = url.replace(`:${key}`, encodeURIComponent(value));
    }
    return url;
  }
  return endpoint;
}

/**
 * Builds Axios config from request options.
 */
function buildConfig(options?: RequestOptions): AxiosRequestConfig {
  if (!options) return {};

  const { pathParams: _pathParams, signal, ...rest } = options;

  const config: AxiosRequestConfig = { ...rest };

  // Add AbortSignal support
  if (signal) {
    config.signal = signal;
  }

  return config;
}
