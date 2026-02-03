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
import { getStoredTokens } from '../utils/secureStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Custom error class for consent API errors.
 */
export class ConsentApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ConsentApiError';
  }
}

/**
 * Get authorization headers from stored tokens.
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const tokens = await getStoredTokens();
  if (!tokens?.accessToken) {
    throw new ConsentApiError('UNAUTHORIZED', 'Not authenticated', 401);
  }
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${tokens.accessToken}`,
  };
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
  const headers = await getAuthHeaders();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        code: 'UNKNOWN_ERROR',
        message: consentErrorMessages.unknownError,
      }));
      throw new ConsentApiError(errorData.code, errorData.message, response.status);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ConsentApiError(
        'REQUEST_TIMEOUT',
        consentErrorMessages.networkError,
        0
      );
    }
    if (error instanceof TypeError) {
      throw new ConsentApiError(
        'NETWORK_ERROR',
        consentErrorMessages.networkError,
        0
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Check for available data reuse consent options for an application.
 */
export async function getConsentPrompt(
  applicationId: string
): Promise<ConsentPromptRequest | null> {
  try {
    return await apiRequest<ConsentPromptRequest>(
      `/v1/consent/prompt/${applicationId}`,
      { method: 'GET' }
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
    return await apiRequest<ConsentSubmitResponse>('/v1/consent', {
      method: 'POST',
      body: JSON.stringify(request),
    });
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
  return await apiRequest<ConsentStatusResponse>('/v1/consent', {
    method: 'GET',
  });
}

/**
 * Get a single consent decision by ID.
 */
export async function getConsentById(consentId: string): Promise<ConsentDecision> {
  return await apiRequest<ConsentDecision>(`/v1/consent/${consentId}`, {
    method: 'GET',
  });
}

/**
 * Update consent (modify scopes or withdraw).
 */
export async function updateConsent(
  request: ConsentUpdateRequest
): Promise<ConsentDecision> {
  try {
    return await apiRequest<ConsentDecision>(`/v1/consent/${request.consentId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        scopes: request.scopes,
        withdraw: request.withdraw,
      }),
    });
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
  return updateConsent({ consentId, withdraw: true });
}
