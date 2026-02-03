/**
 * Audit Event Models
 * Task 1.7: Authentication audit logging models
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
  | 'AUTH_ANOMALY_DETECTED';

export interface AuditEvent {
  id: string;
  eventType: AuditEventType;
  actorId?: string;
  actorType?: 'user' | 'candidate' | 'system';
  targetId?: string;
  targetType?: string;
  channel: 'web' | 'mobile' | 'api';
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
