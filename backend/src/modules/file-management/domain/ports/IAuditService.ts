/**
 * Audit service port — defines contract for recording file audit events
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
}
