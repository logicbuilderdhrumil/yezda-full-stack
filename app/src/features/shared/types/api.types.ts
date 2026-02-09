/**
 * App-backend API contract types.
 * Aligned with backend validation schemas and error envelopes.
 */

/* =============================================================================
 * Error Envelope
 * ============================================================================= */

/** Standard API error envelope matching backend format */
export interface ApiErrorEnvelope {
  error: string;
  code: string;
}

/** API error codes for auth operations */
export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'SESSION_EXPIRED'
  | 'MFA_REQUIRED'
  | 'MFA_FAILED'
  | 'UNAUTHORIZED'
  | 'NETWORK_ERROR'
  | 'REQUEST_TIMEOUT'
  | 'UNKNOWN_ERROR';

/** API error codes for profile operations */
export type ProfileErrorCode =
  | 'UNAUTHORIZED'
  | 'PROFILE_NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'REQUEST_TIMEOUT'
  | 'UNKNOWN_ERROR';

/** API error codes for notification operations */
export type NotificationErrorCode =
  | 'UNAUTHORIZED'
  | 'INVALID_TOKEN_FORMAT'
  | 'CROSS_TENANT_REGISTRATION'
  | 'TOKEN_NOT_FOUND'
  | 'TOKEN_OWNERSHIP_MISMATCH'
  | 'NETWORK_ERROR'
  | 'REQUEST_TIMEOUT'
  | 'UNKNOWN_ERROR';

/* =============================================================================
 * User Types
 * ============================================================================= */

/** User type discriminator aligned with backend */
export type UserType = 'user' | 'candidate';

/* =============================================================================
 * Auth Contracts
 * ============================================================================= */

/** Sign-in request aligned with backend appSignInSchema */
export interface SignInRequestDto {
  email: string;
  password: string;
  deviceId: string;
  platform: DevicePlatform;
  appVersion: string;
  deviceName?: string;
  osVersion?: string;
  model?: string;
  mfaCode?: string;
}

/** Token pair response from backend */
export interface TokenPairDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

/** Sign-in response from backend */
export interface SignInResponseDto {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: 'Bearer';
  requiresMfa?: boolean;
  mfaSessionToken?: string;
}

/** MFA verification request aligned with backend mfaVerifySchema */
export interface MfaVerifyRequestDto {
  mfaSessionToken: string;
  mfaCode: string;
}

/** Token refresh request aligned with backend refreshTokenSchema */
export interface RefreshTokenRequestDto {
  refreshToken: string;
}

/** Token refresh response from backend */
export interface RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

/* =============================================================================
 * Profile Contracts
 * ============================================================================= */

/** Profile address aligned with backend */
export interface ProfileAddressDto {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

/** User profile read response */
export interface ProfileDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: ProfileAddressDto;
}

/** Profile read API response envelope */
export interface ProfileResponseDto {
  profile: ProfileDto;
}

/** Profile update request payload */
export interface ProfileUpdateRequestDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: ProfileAddressDto;
}

/** Profile update response envelope */
export interface ProfileUpdateResponseDto {
  profile: ProfileDto;
}

/* =============================================================================
 * Notification / Device Token Contracts
 * ============================================================================= */

/** Platform discriminator for device tokens */
export type DevicePlatform = 'ios' | 'android' | 'web';

/** Device token registration request aligned with backend deviceTokenRegistrationSchema */
export interface DeviceTokenRegistrationRequestDto {
  token: string;
  platform: DevicePlatform;
  deviceId?: string;
  deviceName?: string;
  appVersion?: string;
}

/** Device token registration response */
export interface DeviceTokenRegistrationResponseDto {
  message: string;
  tokenId: string;
}

/** Device token unregistration request */
export interface DeviceTokenUnregistrationRequestDto {
  token: string;
}

/** Device token info returned by list endpoint */
export interface DeviceTokenInfoDto {
  id: string;
  platform: DevicePlatform;
  deviceId?: string;
  deviceName?: string;
  appVersion?: string;
  createdAt: string;
  lastUsedAt?: string;
}

/** Active tokens list response */
export interface ActiveTokensResponseDto {
  tokens: DeviceTokenInfoDto[];
}

/* =============================================================================
 * Common Headers
 * ============================================================================= */

/** Required headers for authenticated app requests */
export interface AppRequestHeaders {
  Authorization: string;
  'Content-Type': 'application/json';
  'x-tenant-id'?: string;
  'x-channel'?: 'mobile';
  'x-device-info'?: string;
}
