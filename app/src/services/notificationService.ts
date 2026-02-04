/**
 * Notification API service for device token registration and management.
 * Integration: Aligned with backend firebase.routes.ts and firebase.controller.ts contracts.
 */

import type {
  DeviceTokenRegistrationRequestDto,
  DeviceTokenRegistrationResponseDto,
  DeviceTokenUnregistrationRequestDto,
  DeviceTokenInfoDto,
  ActiveTokensResponseDto,
  DevicePlatform,
  NotificationErrorCode,
} from '../types/api.types';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || (process.env.NODE_ENV === 'test' ? 'http://localhost:3000/api' : undefined);

if (!API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_URL environment variable is required');
}

const REQUEST_TIMEOUT_MS = 30000;

/** Notification error messages for user display */
export const notificationErrorMessages = {
  invalidTokenFormat: 'Invalid device token format.',
  crossTenantRegistration: 'Token registration denied.',
  tokenNotFound: 'Device token not found.',
  tokenOwnershipMismatch: 'Token does not belong to this account.',
  networkError: 'Connection failed. Check your network and try again.',
  unauthorized: 'Session expired. Please sign in again.',
  unknownError: 'An unexpected error occurred. Please try again later.',
} as const;

/**
 * Custom error class for notification API errors.
 */
export class NotificationApiError extends Error {
  constructor(
    public code: NotificationErrorCode,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'NotificationApiError';
  }
}

/**
 * Get platform identifier for device token registration.
 */
function getPlatform(): DevicePlatform {
  switch (Platform.OS) {
    case 'ios':
      return 'ios';
    case 'android':
      return 'android';
    default:
      return 'web';
  }
}

/**
 * Generic fetch wrapper with error handling and timeout.
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = REQUEST_TIMEOUT_MS
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-channel': 'mobile',
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        code: 'UNKNOWN_ERROR',
        error: notificationErrorMessages.unknownError,
      }));
      throw new NotificationApiError(
        errorData.code as NotificationErrorCode,
        errorData.error,
        response.status
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new NotificationApiError(
        'REQUEST_TIMEOUT',
        notificationErrorMessages.networkError,
        0
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Register device token for push notifications.
 * Aligned with POST /api/v1/firebase/tokens
 */
export async function registerDeviceToken(
  accessToken: string,
  token: string,
  options?: {
    deviceId?: string;
    deviceName?: string;
    appVersion?: string;
    tenantId?: string;
  }
): Promise<DeviceTokenRegistrationResponseDto> {
  const payload: DeviceTokenRegistrationRequestDto = {
    token,
    platform: getPlatform(),
    deviceId: options?.deviceId,
    deviceName: options?.deviceName,
    appVersion: options?.appVersion,
  };

  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
  };

  if (options?.tenantId) {
    (headers as Record<string, string>)['x-tenant-id'] = options.tenantId;
  }

  try {
    return await apiRequest<DeviceTokenRegistrationResponseDto>(
      '/v1/firebase/tokens',
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      }
    );
  } catch (error) {
    if (error instanceof NotificationApiError) {
      if (error.status === 401) {
        throw new NotificationApiError(
          'UNAUTHORIZED',
          notificationErrorMessages.unauthorized,
          401
        );
      }
      if (error.status === 403) {
        throw new NotificationApiError(
          'CROSS_TENANT_REGISTRATION',
          notificationErrorMessages.crossTenantRegistration,
          403
        );
      }
      if (error.code === 'INVALID_TOKEN_FORMAT') {
        throw new NotificationApiError(
          'INVALID_TOKEN_FORMAT',
          notificationErrorMessages.invalidTokenFormat,
          400
        );
      }
    }
    if (error instanceof TypeError) {
      throw new NotificationApiError(
        'NETWORK_ERROR',
        notificationErrorMessages.networkError,
        0
      );
    }
    throw error;
  }
}

/**
 * Unregister device token.
 * Aligned with DELETE /api/v1/firebase/tokens
 */
export async function unregisterDeviceToken(
  accessToken: string,
  token: string,
  tenantId?: string
): Promise<void> {
  const payload: DeviceTokenUnregistrationRequestDto = { token };

  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
  };

  if (tenantId) {
    (headers as Record<string, string>)['x-tenant-id'] = tenantId;
  }

  try {
    await apiRequest<{ message: string }>('/v1/firebase/tokens', {
      method: 'DELETE',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof NotificationApiError) {
      if (error.status === 401) {
        throw new NotificationApiError(
          'UNAUTHORIZED',
          notificationErrorMessages.unauthorized,
          401
        );
      }
      if (error.status === 404) {
        throw new NotificationApiError(
          'TOKEN_NOT_FOUND',
          notificationErrorMessages.tokenNotFound,
          404
        );
      }
    }
    if (error instanceof TypeError) {
      throw new NotificationApiError(
        'NETWORK_ERROR',
        notificationErrorMessages.networkError,
        0
      );
    }
    throw error;
  }
}

/**
 * Unregister all device tokens for current user.
 * Aligned with DELETE /api/v1/firebase/tokens/all
 */
export async function unregisterAllDeviceTokens(
  accessToken: string,
  tenantId?: string
): Promise<{ count: number }> {
  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
  };

  if (tenantId) {
    (headers as Record<string, string>)['x-tenant-id'] = tenantId;
  }

  try {
    const response = await apiRequest<{ message: string; count: number }>(
      '/v1/firebase/tokens/all',
      {
        method: 'DELETE',
        headers,
      }
    );
    return { count: response.count };
  } catch (error) {
    if (error instanceof NotificationApiError && error.status === 401) {
      throw new NotificationApiError(
        'UNAUTHORIZED',
        notificationErrorMessages.unauthorized,
        401
      );
    }
    if (error instanceof TypeError) {
      throw new NotificationApiError(
        'NETWORK_ERROR',
        notificationErrorMessages.networkError,
        0
      );
    }
    throw error;
  }
}

/**
 * Get all active device tokens for current user.
 * Aligned with GET /api/v1/firebase/tokens
 */
export async function getActiveDeviceTokens(
  accessToken: string,
  tenantId?: string
): Promise<DeviceTokenInfoDto[]> {
  const headers: HeadersInit = {
    Authorization: `Bearer ${accessToken}`,
  };

  if (tenantId) {
    (headers as Record<string, string>)['x-tenant-id'] = tenantId;
  }

  try {
    const response = await apiRequest<ActiveTokensResponseDto>(
      '/v1/firebase/tokens',
      {
        method: 'GET',
        headers,
      }
    );
    return response.tokens;
  } catch (error) {
    if (error instanceof NotificationApiError && error.status === 401) {
      throw new NotificationApiError(
        'UNAUTHORIZED',
        notificationErrorMessages.unauthorized,
        401
      );
    }
    if (error instanceof TypeError) {
      throw new NotificationApiError(
        'NETWORK_ERROR',
        notificationErrorMessages.networkError,
        0
      );
    }
    throw error;
  }
}
