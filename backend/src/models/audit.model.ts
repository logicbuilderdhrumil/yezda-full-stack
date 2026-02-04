/**
 * Audit Event Models
 * Task 1.7: Authentication audit logging models
 * Socket audit events added for socket infrastructure
 * OAuth audit events added for OAuth integration
 */

export type AuditEventType =
  | 'AUTH_SIGN_IN_SUCCESS'
  | 'AUTH_SIGN_IN_FAILURE'
  | 'AUTH_SIGN_UP'
  | 'AUTH_SIGN_OUT'
  | 'AUTH_TOKEN_REFRESH'
  | 'AUTH_TOKEN_REVOKED'
  | 'AUTH_PASSWORD_RESET_REQUEST'
  | 'AUTH_PASSWORD_RESET_SUCCESS'
  | 'AUTH_MFA_ENROLLED'
  | 'AUTH_MFA_VERIFIED'
  | 'AUTH_MFA_DISABLED'
  | 'AUTH_ACCOUNT_LOCKED'
  | 'AUTH_ACCOUNT_UNLOCKED'
  | 'AUTH_ANOMALY_DETECTED'
  | 'GUARD_AUTH_DENIED'
  | 'GUARD_ROLE_DENIED'
  | 'GUARD_ACCESS_GRANTED'
  | 'SHELL_PREFERENCE_UPDATED'
  | 'SHELL_NAVIGATION_POLICY_UPDATED'
  | 'SHELL_CONFIG_ACCESSED'
  // Socket-related audit events
  | 'SOCKET_CONNECTED'
  | 'SOCKET_DISCONNECTED'
  | 'SOCKET_AUTH_SUCCESS'
  | 'SOCKET_AUTH_FAILURE'
  | 'SOCKET_SUBSCRIPTION_GRANTED'
  | 'SOCKET_SUBSCRIPTION_DENIED'
  | 'SOCKET_RATE_LIMITED'
  // Firebase-related audit events
  | 'FIREBASE_TOKEN_REGISTERED'
  | 'FIREBASE_TOKEN_UNREGISTERED'
  | 'FIREBASE_TOKEN_REGISTRATION_DENIED'
  | 'FIREBASE_NOTIFICATION_DISPATCHED'
  | 'FIREBASE_NOTIFICATION_FAILED'
  // Notification-related audit events
  | 'NOTIFICATION_CREATED'
  | 'NOTIFICATION_ACCESSED'
  | 'NOTIFICATION_ACCESS_DENIED'
  | 'NOTIFICATION_LIST_ACCESSED'
  | 'NOTIFICATION_READ'
  | 'NOTIFICATION_UNREAD'
  | 'NOTIFICATION_BATCH_READ'
  // Localization-related audit events
  | 'LOCALE_PREFERENCE_UPDATED'
  | 'LOCALE_UPDATE_DENIED'
  | 'TRANSLATION_ACCESSED'
  // OAuth-related audit events
  | 'OAUTH_AUTHORIZE_INITIATED'
  | 'OAUTH_CALLBACK_SUCCESS'
  | 'OAUTH_CALLBACK_FAILURE'
  | 'OAUTH_TOKEN_REFRESH_SUCCESS'
  | 'OAUTH_TOKEN_REFRESH_FAILURE'
  | 'OAUTH_INTEGRATION_DISCONNECTED'
  | 'OAUTH_INVALID_STATE'
  // Mock API-related audit events
  | 'MOCK_MODE_ENABLED'
  | 'MOCK_MODE_DISABLED'
  | 'MOCK_MODE_BLOCKED'
  | 'MOCK_FIXTURE_ACCESSED'
  | 'MOCK_ENDPOINT_CALLED'
  // UI Kit-related audit events
  | 'UI_CONFIG_ACCESSED'
  | 'UI_CONFIG_ACCESS_DENIED'
  // Organization management audit events
  | 'ORG_CREATED'
  | 'ORG_UPDATED'
  | 'ORG_STATUS_CHANGED'
  | 'ORG_ACCESSED'
  | 'ORG_LIST_ACCESSED'
  | 'ORG_ACCESS_DENIED'
  | 'ORG_RATE_LIMITED'
  // Account settings audit events
  | 'PROFILE_READ'
  | 'PROFILE_UPDATED'
  | 'PROFILE_UPDATE_DENIED'
  | 'INTEGRATION_STATUS_READ'
  | 'INTEGRATION_CONNECTED'
  | 'INTEGRATION_VERIFIED'
  | 'INTEGRATION_VERIFICATION_FAILED'
  | 'INTEGRATION_DISCONNECTED'
  | 'INTEGRATION_ACCESS_DENIED'
  // App consent reuse audit events
  | 'CONSENT_GRANTED'
  | 'CONSENT_UPDATED'
  | 'CONSENT_WITHDRAWN'
  | 'CONSENT_EXPIRED'
  | 'CONSENT_REUSE_ALLOWED'
  | 'CONSENT_REUSE_DENIED'
  | 'CONSENT_ACCESS_DENIED';

export interface AuditEvent {
  id: string;
  eventType: AuditEventType;
  actorId?: string;
  actorType?: 'user' | 'candidate' | 'system';
  targetId?: string;
  targetType?: string;
  channel: 'web' | 'mobile' | 'api' | 'socket';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

export interface AuditLogEntry {
  event: AuditEvent;
  success: boolean;
  errorMessage?: string;
}
