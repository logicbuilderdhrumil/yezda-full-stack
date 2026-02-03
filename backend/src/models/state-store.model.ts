/**
 * State Store Models
 * Task 1.1: Define preference and session state schemas
 */

/** Preference types supported by the state store */
export type PreferenceKey = 'theme' | 'locale' | 'presence';

/** Presence status values */
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

/** Theme values */
export type ThemeValue = 'light' | 'dark' | 'system';

/** Locale pattern (e.g., en-US, fr-FR) */
export type LocaleValue = string;

/** State entry stored in the database */
export interface StateEntry {
  id: string;
  tenantId: string;
  userId: string;
  userType: 'user' | 'candidate';
  key: string;
  value: string; // Encrypted JSON string
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/** Preference structure for user preferences */
export interface UserPreferences {
  theme?: ThemeValue;
  locale?: LocaleValue;
  presence?: PresenceStatus;
}

/** Session state for authenticated contexts */
export interface SessionState {
  lastActivity?: Date;
  currentView?: string;
  unsavedChanges?: boolean;
  customData?: Record<string, unknown>;
}

/** Combined state for a user */
export interface UserState {
  preferences: UserPreferences;
  sessionState: SessionState;
}

/** State access event types for audit logging */
export type StateEventType =
  | 'STATE_READ'
  | 'STATE_WRITE'
  | 'STATE_DELETE'
  | 'STATE_ACCESS_DENIED';

/** State operation result */
export interface StateOperationResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  data?: unknown;
}

/** Rate limit configuration for state operations */
export interface StateRateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

/** SLO targets for state store operations */
export const STATE_STORE_SLOS = {
  // Latency SLOs
  READ_LATENCY_P99_MS: 100,
  WRITE_LATENCY_P99_MS: 200,
  
  // Availability SLOs
  READ_SUCCESS_RATE: 99.9,
  WRITE_SUCCESS_RATE: 99.5,
  
  // Rate limits
  DEFAULT_RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  DEFAULT_RATE_LIMIT_MAX_REQUESTS: 60, // 60 per minute
} as const;
