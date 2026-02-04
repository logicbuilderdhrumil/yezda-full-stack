/**
 * Account Settings Models
 * Task 1.1: Define profile and integration status models
 */

/**
 * User profile data that can be updated
 */
export interface UserProfile {
  id: string;
  tenantId: string;
  userId: string;
  userType: 'user' | 'candidate';
  displayName?: string;
  avatarUrl?: string;
  phone?: string;
  timezone?: string;
  locale?: string;
  bio?: string;
  notificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Profile update request payload
 */
export interface ProfileUpdateRequest {
  displayName?: string;
  avatarUrl?: string;
  phone?: string;
  timezone?: string;
  locale?: string;
  bio?: string;
  notificationsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
}

/**
 * Profile response returned to clients (no sensitive data)
 */
export interface ProfileResponse {
  id: string;
  displayName?: string;
  avatarUrl?: string;
  phone?: string;
  timezone?: string;
  locale?: string;
  bio?: string;
  notificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Supported integration providers for account settings
 */
export type IntegrationProvider = 'google' | 'microsoft' | 'slack' | 'github';

/**
 * Integration status stored in database
 */
export interface IntegrationRecord {
  id: string;
  tenantId: string;
  userId: string;
  userType: 'user' | 'candidate';
  provider: IntegrationProvider;
  providerAccountId?: string;
  providerEmail?: string;
  isConnected: boolean;
  isVerified: boolean;
  scopes: string[];
  connectedAt?: Date;
  verifiedAt?: Date;
  lastVerificationError?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Integration status returned to clients
 */
export interface IntegrationStatusResponse {
  provider: IntegrationProvider;
  connected: boolean;
  verified: boolean;
  providerEmail?: string;
  scopes: string[];
  connectedAt?: Date;
  verifiedAt?: Date;
  hasError: boolean;
  errorMessage?: string;
}

/**
 * Integration verification callback payload
 */
export interface IntegrationVerificationCallback {
  provider: IntegrationProvider;
  state: string;
  code?: string;
  error?: string;
  errorDescription?: string;
}

/**
 * Integration verification result
 */
export interface IntegrationVerificationResult {
  success: boolean;
  provider?: IntegrationProvider;
  providerAccountId?: string;
  providerEmail?: string;
  scopes?: string[];
  error?: string;
  errorCode?: string;
}

/**
 * Account settings SLO targets
 */
export const ACCOUNT_SETTINGS_SLOS = {
  // Latency SLOs
  PROFILE_READ_LATENCY_P99_MS: 100,
  PROFILE_READ_LATENCY_P95_MS: 50,
  PROFILE_UPDATE_LATENCY_P99_MS: 200,
  PROFILE_UPDATE_LATENCY_P95_MS: 100,
  INTEGRATION_STATUS_LATENCY_P99_MS: 150,
  INTEGRATION_STATUS_LATENCY_P95_MS: 75,
  INTEGRATION_CALLBACK_LATENCY_P99_MS: 500,
  INTEGRATION_CALLBACK_LATENCY_P95_MS: 250,

  // Availability SLOs
  PROFILE_AVAILABILITY_RATE: 99.9,
  INTEGRATION_AVAILABILITY_RATE: 99.5,

  // Rate limiting SLOs
  MAX_PROFILE_UPDATE_RATE_LIMIT_HITS_PER_MINUTE: 50,
  MAX_INTEGRATION_CALLBACK_RATE_LIMIT_HITS_PER_MINUTE: 30,
} as const;

/**
 * Metric names for account settings
 */
export const ACCOUNT_SETTINGS_METRICS = {
  PROFILE_READ: 'account_settings_profile_read_total',
  PROFILE_UPDATE: 'account_settings_profile_update_total',
  PROFILE_UPDATE_DENIED: 'account_settings_profile_update_denied_total',
  PROFILE_LATENCY: 'account_settings_profile_latency_ms',
  INTEGRATION_STATUS_READ: 'account_settings_integration_status_read_total',
  INTEGRATION_CALLBACK: 'account_settings_integration_callback_total',
  INTEGRATION_CALLBACK_SUCCESS: 'account_settings_integration_callback_success_total',
  INTEGRATION_CALLBACK_FAILURE: 'account_settings_integration_callback_failure_total',
  INTEGRATION_LATENCY: 'account_settings_integration_latency_ms',
  RATE_LIMIT_HIT: 'account_settings_rate_limit_hit_total',
} as const;

/**
 * Audit event types for account settings
 */
export type AccountSettingsAuditEventType =
  | 'PROFILE_READ'
  | 'PROFILE_UPDATED'
  | 'PROFILE_UPDATE_DENIED'
  | 'INTEGRATION_STATUS_READ'
  | 'INTEGRATION_CONNECTED'
  | 'INTEGRATION_VERIFIED'
  | 'INTEGRATION_VERIFICATION_FAILED'
  | 'INTEGRATION_DISCONNECTED'
  | 'INTEGRATION_ACCESS_DENIED';
