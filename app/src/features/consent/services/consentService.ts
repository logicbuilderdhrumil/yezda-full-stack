/**
 * Consent API service for data reuse consent management.
 * Task 1.3: Implement consent submission to backend service.
 */

import {
  ConsentPromptRequest,
  ConsentSubmitRequest,
  ConsentSubmitResponse,
  ConsentUpdateRequest,
  ConsentStatusResponse,
  ConsentDecision,
  consentErrorMessages,
} from '../types/consent.types';
import { apiRequest, ApiError, type ApiRequestConfig } from '@/services/apiClient';

/**
 * Custom error class for consent API errors.
 */
export class ConsentApiError extends ApiError {
  constructor(code: string, message: string, status: number) {
    super(code, message, status);
    this.name = 'ConsentApiError';
  }
}

/** Shared request config for consent API calls (auto-injects auth token). */
const consentRequestConfig: ApiRequestConfig = {
  ErrorClass: ConsentApiError,
  fallbackErrorMessage: consentErrorMessages.unknownError,
  networkErrorMessage: consentErrorMessages.networkError,
  authenticated: true,
};

/**
 * Check for available data reuse consent options for an application.
 */
export async function getConsentPrompt(
  applicationId: string
): Promise<ConsentPromptRequest | null> {
  try {
    return await apiRequest<ConsentPromptRequest>(
      `/v1/app/consent/prompt/${applicationId}`,
      { method: 'GET' },
      consentRequestConfig
    );
  } catch (error) {
    if (error instanceof ConsentApiError && error.status === 404) {
      return null; // No reusable data available
    }
    throw error;
  }
}

/**
 * Submit consent decision (accept or decline data reuse).
 */
export async function submitConsent(
  request: ConsentSubmitRequest
): Promise<ConsentSubmitResponse> {
  try {
    return await apiRequest<ConsentSubmitResponse>('/v1/app/consent', {
      method: 'POST',
      body: JSON.stringify(request),
    }, consentRequestConfig);
  } catch (error) {
    if (error instanceof ConsentApiError) {
      // Preserve original error message for debugging context
      throw new ConsentApiError(
        error.code,
        error.message || consentErrorMessages.submitFailed,
        error.status
      );
    }
    throw error;
  }
}

/**
 * Get all consent decisions for the current user.
 */
export async function getConsentStatus(): Promise<ConsentStatusResponse> {
  return await apiRequest<ConsentStatusResponse>('/v1/app/consent', {
    method: 'GET',
  }, consentRequestConfig);
}

/**
 * Get a single consent decision by ID.
 */
export async function getConsentById(consentId: string): Promise<ConsentDecision> {
  return await apiRequest<ConsentDecision>(`/v1/app/consent/${consentId}`, {
    method: 'GET',
  }, consentRequestConfig);
}

/**
 * Update consent (modify scopes or withdraw).
 */
export async function updateConsent(
  consentId: string,
  request: ConsentUpdateRequest
): Promise<ConsentDecision> {
  try {
    return await apiRequest<ConsentDecision>(`/v1/app/consent/${consentId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        scopes: request.scopes,
        withdraw: request.withdraw,
      }),
    }, consentRequestConfig);
  } catch (error) {
    if (error instanceof ConsentApiError) {
      const message = request.withdraw
        ? consentErrorMessages.withdrawFailed
        : consentErrorMessages.submitFailed;
      throw new ConsentApiError(error.code, message, error.status);
    }
    throw error;
  }
}

/**
 * Withdraw consent entirely.
 */
export async function withdrawConsent(consentId: string): Promise<ConsentDecision> {
  return updateConsent(consentId, { withdraw: true });
}
