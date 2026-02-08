/**
 * Shared feature module - Cross-cutting services and types.
 */

export { API_BASE_URL, REQUEST_TIMEOUT_MS, ApiError, apiRequest } from './services/apiClient';
export type { ApiErrorConstructor, ApiRequestConfig } from './services/apiClient';
export * from './types/api.types';
