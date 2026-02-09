/**
 * Audit service port — defines contract for recording audit events
 */
export interface IAuditService {
  log(params: {
    eventType: string;
    actorId?: string;
    actorType?: 'user' | 'candidate' | 'system';
    targetId?: string;
    targetType?: string;
    channel: 'web' | 'mobile' | 'api' | 'socket';
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
    success?: boolean;
    errorMessage?: string;
  }): unknown;

  logSignInSuccess(params: {
    userId: string;
    userType: 'user' | 'candidate';
    channel: string;
    ipAddress?: string;
    userAgent?: string;
  }): unknown;

  logSignInFailure(params: {
    email: string;
    reason: string;
    channel: string;
    ipAddress?: string;
    userAgent?: string;
  }): unknown;

  logPasswordResetRequest(params: {
    userId: string;
    userType: 'user' | 'candidate';
    channel: string;
    ipAddress?: string;
    userAgent?: string;
  }): unknown;

  logPasswordResetSuccess(params: {
    userId: string;
    userType: 'user' | 'candidate';
    channel: string;
    ipAddress?: string;
    userAgent?: string;
  }): unknown;

  logMfaEnrolled(params: {
    userId: string;
    userType: 'user' | 'candidate';
    channel: string;
    ipAddress?: string;
    userAgent?: string;
  }): unknown;

  logAccountLocked(params: {
    userId: string;
    userType: 'user' | 'candidate';
    reason: string;
    channel: string;
    ipAddress?: string;
  }): unknown;
}
