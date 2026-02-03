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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Custom error class for application API errors.
 */
export class ApplicationApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApplicationApiError';
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
        message: applicationErrorMessages.unknownError,
      }));
      throw new ApplicationApiError(errorData.code, errorData.message, response.status);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApplicationApiError(
        'REQUEST_TIMEOUT',
        applicationErrorMessages.networkError,
        0
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch the list of assigned applications for the current user.
 */
export async function getApplications(accessToken: string): Promise<ApplicationListResponse> {
  try {
    return await apiRequest<ApplicationListResponse>('/v1/applications', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
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
    return await apiRequest<ApplicationDetailResponse>(`/v1/applications/${applicationId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
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
    return await apiRequest<ApplicationDraftResponse>(`/v1/applications/${applicationId}/draft`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
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
    return await apiRequest<SaveDraftResponse>(`/v1/applications/${applicationId}/draft`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });
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
    return await apiRequest<SubmitApplicationResponse>(`/v1/applications/${applicationId}/submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    });
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
