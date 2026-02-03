/**
 * Profile API service for fetching and updating user profile.
 * Task 1.4: Integrate profile read API call.
 * Task 1.5: Integrate profile update API call.
 */

import {
  UserProfile,
  ProfileUpdateRequest,
  ProfileResponse,
  ProfileUpdateResponse,
  profileErrorMessages,
} from '../types/profile.types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Custom error class for profile API errors.
 */
export class ProfileApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ProfileApiError';
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
    ...options.headers,
  };

  // Create abort controller for timeout
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
        message: profileErrorMessages.unknownError,
      }));
      throw new ProfileApiError(errorData.code, errorData.message, response.status);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ProfileApiError(
        'REQUEST_TIMEOUT',
        profileErrorMessages.networkError,
        0
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch the current user's profile.
 */
export async function getProfile(accessToken: string): Promise<UserProfile> {
  try {
    const response = await apiRequest<ProfileResponse>('/v1/profile', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.profile;
  } catch (error) {
    if (error instanceof ProfileApiError) {
      if (error.status === 401) {
        throw new ProfileApiError(
          'UNAUTHORIZED',
          'Session expired. Please sign in again.',
          401
        );
      }
    }
    if (error instanceof TypeError) {
      throw new ProfileApiError(
        'NETWORK_ERROR',
        profileErrorMessages.networkError,
        0
      );
    }
    throw error;
  }
}

/**
 * Update the current user's profile.
 */
export async function updateProfile(
  accessToken: string,
  data: ProfileUpdateRequest
): Promise<UserProfile> {
  try {
    const response = await apiRequest<ProfileUpdateResponse>('/v1/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });
    return response.profile;
  } catch (error) {
    if (error instanceof ProfileApiError) {
      if (error.status === 401) {
        throw new ProfileApiError(
          'UNAUTHORIZED',
          'Session expired. Please sign in again.',
          401
        );
      }
      if (error.status === 400) {
        throw new ProfileApiError(
          'VALIDATION_ERROR',
          profileErrorMessages.validationFailed,
          400
        );
      }
    }
    if (error instanceof TypeError) {
      throw new ProfileApiError(
        'NETWORK_ERROR',
        profileErrorMessages.networkError,
        0
      );
    }
    throw error;
  }
}
