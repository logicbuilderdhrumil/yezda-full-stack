/**
 * Account profile types for frontend.
 * Task 1.1: Define account profile data model and form fields
 */

/** Account profile data returned from API. */
export interface AccountProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | undefined;
  avatarUrl?: string | undefined;
  timezone?: string | undefined;
  locale?: string | undefined;
  createdAt: string;
  updatedAt: string;
}

/** Payload for updating account profile. */
export interface UpdateProfilePayload {
  firstName?: string | undefined;
  lastName?: string | undefined;
  phone?: string | undefined;
  timezone?: string | undefined;
  locale?: string | undefined;
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
