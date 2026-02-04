/**
 * Account Service
 * Aligned with backend contract (account-settings.controller.ts).
 */
import axios from 'axios';
import type {
  AccountProfile,
  UpdateProfilePayload,
  AvatarUploadResponse,
  ChangePasswordPayload,
  AccountError,
  IntegrationStatus,
  IntegrationsResponse,
  IntegrationProvider,
  IntegrationVerifyPayload,
} from '@/@types/account';

const API_BASE = '/api/v1/account';

/** Singleton axios instance for Account API calls */
const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/** Extracts structured error from axios error response */
function extractError(err: unknown): AccountError {
  if (axios.isAxiosError<Partial<AccountError>>(err)) {
    const data = err.response?.data;
    if (data) {
      return {
        code: data.code ?? 'ACCOUNT_ERROR',
        message: data.message ?? 'An unexpected error occurred',
        ...(data.field !== undefined ? { field: data.field } : {}),
      };
    }
  }
  return {
    code: 'NETWORK_ERROR',
    message: 'Unable to connect to the server',
  };
}

/**
 * AccountService encapsulates all account-related API calls.
 */
export const AccountService = {
  /**
   * Get the current user's profile.
   */
  async getProfile(): Promise<AccountProfile> {
    try {
      const response = await client.get<AccountProfile>('/profile');
      return response.data;
    } catch (err) {
      throw extractError(err);
    }
  },

  /**
   * Update the current user's profile.
   * @param payload The profile updates to apply.
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<AccountProfile> {
    try {
      const response = await client.patch<AccountProfile>('/profile', payload);
      return response.data;
    } catch (err) {
      throw extractError(err);
    }
  },

  /**
   * Upload a new avatar image.
   * @param file The image file to upload.
   */
  async uploadAvatar(file: File): Promise<AvatarUploadResponse> {
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const response = await client.post<AvatarUploadResponse>('/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (err) {
      throw extractError(err);
    }
  },

  /**
   * Remove the current avatar.
   */
  async removeAvatar(): Promise<void> {
    try {
      await client.delete('/avatar');
    } catch (err) {
      throw extractError(err);
    }
  },

  /**
   * Change the user's password.
   * @param payload Current and new password.
   */
  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    try {
      await client.post('/password', payload);
    } catch (err) {
      throw extractError(err);
    }
  },

  // Integration methods - aligned with backend routes

  /**
   * Get all integration statuses for current user.
   */
  async getIntegrations(): Promise<IntegrationStatus[]> {
    try {
      const response = await client.get<IntegrationsResponse>('/integrations');
      return response.data.integrations;
    } catch (err) {
      throw extractError(err);
    }
  },

  /**
   * Get status of a specific integration.
   * @param provider The integration provider.
   */
  async getIntegration(provider: IntegrationProvider): Promise<IntegrationStatus> {
    try {
      const response = await client.get<IntegrationStatus>(`/integrations/${provider}`);
      return response.data;
    } catch (err) {
      throw extractError(err);
    }
  },

  /**
   * Verify an integration after OAuth flow.
   * @param provider The integration provider.
   * @param payload Verification result from OAuth callback.
   */
  async verifyIntegration(
    provider: IntegrationProvider,
    payload: IntegrationVerifyPayload
  ): Promise<IntegrationStatus> {
    try {
      const response = await client.post<{ integration: IntegrationStatus }>(
        `/integrations/${provider}/verify`,
        payload
      );
      return response.data.integration;
    } catch (err) {
      throw extractError(err);
    }
  },

  /**
   * Disconnect an integration.
   * @param provider The integration provider.
   */
  async disconnectIntegration(provider: IntegrationProvider): Promise<void> {
    try {
      await client.delete(`/integrations/${provider}`);
    } catch (err) {
      throw extractError(err);
    }
  },
};
