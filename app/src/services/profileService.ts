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
import { apiRequest, ApiError, type ApiRequestConfig } from './apiClient';

/**
 * Custom error class for profile API errors.
 */
export class ProfileApiError extends ApiError {
  constructor(code: string, message: string, status: number) {
    super(code, message, status);
    this.name = 'ProfileApiError';
  }
}

/** Shared request config for profile API calls. */
const profileRequestConfig: ApiRequestConfig = {
  ErrorClass: ProfileApiError,
  fallbackErrorMessage: profileErrorMessages.unknownError,
  networkErrorMessage: profileErrorMessages.networkError,
};

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
    }, profileRequestConfig);
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
    }, profileRequestConfig);
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
