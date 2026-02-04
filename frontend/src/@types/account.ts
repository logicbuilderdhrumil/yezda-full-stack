/**
 * Account profile types for frontend.
 * Aligned with backend contract (account-settings.model.ts).
 */

/** Supported integration providers - matches backend IntegrationProvider. */
export type IntegrationProvider = 'google' | 'microsoft' | 'slack' | 'github';

/** Account profile data returned from API - aligned with backend ProfileResponse. */
export interface AccountProfile {
  id: string;
  displayName?: string;
  avatarUrl?: string;
  phone?: string;
  timezone?: string;
  locale?: string;
  bio?: string;
  notificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Payload for updating account profile - aligned with backend ProfileUpdateRequest. */
export interface UpdateProfilePayload {
  displayName?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  timezone?: string;
  locale?: string;
  bio?: string | null;
  notificationsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
}

/** Payload for updating avatar. */
export interface UpdateAvatarPayload {
  file: File;
}

/** Response from avatar upload. */
export interface AvatarUploadResponse {
  avatarUrl: string;
}

/** Payload for changing password. */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/** Account settings error. */
export interface AccountError {
  code: string;
  message: string;
  field?: string;
}

/** Integration status response - aligned with backend IntegrationStatusResponse. */
export interface IntegrationStatus {
  provider: IntegrationProvider;
  connected: boolean;
  verified: boolean;
  providerEmail?: string;
  scopes: string[];
  connectedAt?: string;
  verifiedAt?: string;
  hasError: boolean;
  errorMessage?: string;
}

/** Response containing all integrations. */
export interface IntegrationsResponse {
  integrations: IntegrationStatus[];
}

/** Integration verification payload. */
export interface IntegrationVerifyPayload {
  success?: boolean;
  providerAccountId?: string;
  providerEmail?: string;
  scopes?: string[];
  error?: string;
  errorCode?: string;
}
