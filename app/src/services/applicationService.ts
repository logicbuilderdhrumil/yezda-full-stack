/**
 * Application API service for screening applications.
 * Task 1.1: Fetch assigned applications.
 * Task 1.5: Save and load drafts.
 * Task 1.6: Submit applications.
 */

import {
  ApplicationListResponse,
  ApplicationDetailResponse,
  ApplicationDraftResponse,
  SaveDraftRequest,
  SaveDraftResponse,
  SubmitApplicationRequest,
  SubmitApplicationResponse,
  applicationErrorMessages,
} from '../types/application.types';
import { apiRequest, ApiError, type ApiRequestConfig } from './apiClient';

/**
 * Custom error class for application API errors.
 */
export class ApplicationApiError extends ApiError {
  constructor(code: string, message: string, status: number) {
    super(code, message, status);
    this.name = 'ApplicationApiError';
  }
}

/** Shared request config for application API calls. */
const appRequestConfig: ApiRequestConfig = {
  ErrorClass: ApplicationApiError,
  fallbackErrorMessage: applicationErrorMessages.unknownError,
  networkErrorMessage: applicationErrorMessages.networkError,
};

/**
 * Fetch the list of assigned applications for the current user.
 */
export async function getApplications(accessToken: string): Promise<ApplicationListResponse> {
  try {
    return await apiRequest<ApplicationListResponse>('/v1/app/applications', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }, appRequestConfig);
  } catch (error) {
    if (error instanceof ApplicationApiError) {
      if (error.status === 401) {
        throw new ApplicationApiError(
          'UNAUTHORIZED',
          'Session expired. Please sign in again.',
          401
        );
      }
    }
    if (error instanceof TypeError) {
      throw new ApplicationApiError(
        'NETWORK_ERROR',
        applicationErrorMessages.networkError,
        0
      );
    }
    throw error;
  }
}

/**
 * Fetch a single application with full form details.
 */
export async function getApplication(
  accessToken: string,
  applicationId: string
): Promise<ApplicationDetailResponse> {
  try {
    return await apiRequest<ApplicationDetailResponse>(`/v1/app/applications/${applicationId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }, appRequestConfig);
  } catch (error) {
    if (error instanceof ApplicationApiError) {
      if (error.status === 401) {
        throw new ApplicationApiError(
          'UNAUTHORIZED',
          'Session expired. Please sign in again.',
          401
        );
      }
      if (error.status === 404) {
        throw new ApplicationApiError(
          'NOT_FOUND',
          'Application not found.',
          404
        );
      }
    }
    if (error instanceof TypeError) {
      throw new ApplicationApiError(
        'NETWORK_ERROR',
        applicationErrorMessages.networkError,
        0
      );
    }
    throw error;
  }
}

/**
 * Fetch the saved draft for an application.
 */
export async function getApplicationDraft(
  accessToken: string,
  applicationId: string
): Promise<ApplicationDraftResponse> {
  try {
    return await apiRequest<ApplicationDraftResponse>(`/v1/app/applications/${applicationId}/draft`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }, appRequestConfig);
  } catch (error) {
    if (error instanceof ApplicationApiError) {
      if (error.status === 401) {
        throw new ApplicationApiError(
          'UNAUTHORIZED',
          'Session expired. Please sign in again.',
          401
        );
      }
      if (error.status === 404) {
        // No draft exists - return null draft
        return { draft: null };
      }
    }
    if (error instanceof TypeError) {
      throw new ApplicationApiError(
        'NETWORK_ERROR',
        applicationErrorMessages.networkError,
        0
      );
    }
    throw error;
  }
}

/**
 * Save a draft of the application.
 */
export async function saveApplicationDraft(
  accessToken: string,
  applicationId: string,
  data: SaveDraftRequest
): Promise<SaveDraftResponse> {
  try {
    return await apiRequest<SaveDraftResponse>(`/v1/app/applications/${applicationId}/draft`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    }, appRequestConfig);
  } catch (error) {
    if (error instanceof ApplicationApiError) {
      if (error.status === 401) {
        throw new ApplicationApiError(
          'UNAUTHORIZED',
          'Session expired. Please sign in again.',
          401
        );
      }
    }
    if (error instanceof TypeError) {
      throw new ApplicationApiError(
        'NETWORK_ERROR',
        applicationErrorMessages.networkError,
        0
      );
    }
    throw error;
  }
}

/**
 * Submit the application.
 */
export async function submitApplication(
  accessToken: string,
  applicationId: string,
  data: SubmitApplicationRequest
): Promise<SubmitApplicationResponse> {
  try {
    return await apiRequest<SubmitApplicationResponse>(`/v1/app/applications/${applicationId}/submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    }, appRequestConfig);
  } catch (error) {
    if (error instanceof ApplicationApiError) {
      if (error.status === 401) {
        throw new ApplicationApiError(
          'UNAUTHORIZED',
          'Session expired. Please sign in again.',
          401
        );
      }
      if (error.status === 400) {
        throw new ApplicationApiError(
          'VALIDATION_ERROR',
          applicationErrorMessages.validationFailed,
          400
        );
      }
    }
    if (error instanceof TypeError) {
      throw new ApplicationApiError(
        'NETWORK_ERROR',
        applicationErrorMessages.networkError,
        0
      );
    }
    throw error;
  }
}
