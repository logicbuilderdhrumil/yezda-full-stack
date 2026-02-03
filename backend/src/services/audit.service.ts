/**
 * Audit Service
 * Task 1.7: Record audit events for authentication and recovery activities
 * 
 * ⚠️ PRODUCTION BLOCKER: In-memory audit storage
 * Current implementation stores audit logs in-memory which means:
 * - Loss of evidence on server restart (security incidents can't be investigated)
 * - Compliance failure (GDPR/SOC2 require durable audit trails)
 * - Memory exhaustion (logs grow unbounded)
 * 
 * TODO: Before production deployment:
 * 1. Stream audit events to a durable store (database, S3, or SIEM)
 * 2. Implement log rotation/archival strategy
 * 3. Consider structured logging to stdout for container environments (fluentd/ELK collection)
 * 4. Add log retention policy per compliance requirements
 */

import { v4 as uuidv4 } from 'uuid';
import type { AuditEvent, AuditEventType, AuditLogEntry } from '../models/audit.model.js';

// In-memory audit log (replace with persistent storage in production)
const auditLog: AuditLogEntry[] = [];
const MAX_IN_MEMORY_LOGS = 10000; // Limit memory consumption

export class AuditService {
  /**
   * Record an audit event
   */
  log(params: {
    eventType: AuditEventType;
    actorId?: string;
    actorType?: 'user' | 'candidate' | 'system';
    targetId?: string;
    targetType?: string;
    channel: 'web' | 'mobile' | 'api';
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
    success?: boolean;
    errorMessage?: string;
  }): AuditEvent {
    const event: AuditEvent = {
      id: uuidv4(),
      eventType: params.eventType,
      actorId: params.actorId,
      actorType: params.actorType,
      targetId: params.targetId,
      targetType: params.targetType,
      channel: params.channel,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: params.metadata,
      timestamp: new Date(),
    };

    const entry: AuditLogEntry = {
      event,
      success: params.success ?? true,
      errorMessage: params.errorMessage,
    };

    auditLog.push(entry);

    // Prevent unbounded memory growth
    if (auditLog.length > MAX_IN_MEMORY_LOGS) {
      auditLog.shift();
    }

    // Console log for observability (replace with structured logging in production)
    console.log(
      JSON.stringify({
        level: params.success === false ? 'warn' : 'info',
        type: 'audit',
        ...event,
        success: entry.success,
        errorMessage: entry.errorMessage,
      })
    );

    return event;
  }

  /**
   * Log successful sign-in
   */
  logSignInSuccess(params: {
    userId: string;
    userType: 'user' | 'candidate';
    channel: 'web' | 'mobile' | 'api';
    ipAddress?: string;
    userAgent?: string;
  }): AuditEvent {
    return this.log({
      eventType: 'AUTH_SIGN_IN_SUCCESS',
      actorId: params.userId,
      actorType: params.userType,
      channel: params.channel,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      success: true,
    });
  }

  /**
   * Log failed sign-in attempt
   */
  logSignInFailure(params: {
    email: string;
    reason: string;
    channel: 'web' | 'mobile' | 'api';
    ipAddress?: string;
    userAgent?: string;
  }): AuditEvent {
    return this.log({
      eventType: 'AUTH_SIGN_IN_FAILURE',
      channel: params.channel,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      metadata: { email: params.email, reason: params.reason },
      success: false,
      errorMessage: params.reason,
    });
  }

  /**
   * Log password reset request
   */
  logPasswordResetRequest(params: {
    userId: string;
    userType: 'user' | 'candidate';
    channel: 'web' | 'mobile' | 'api';
    ipAddress?: string;
    userAgent?: string;
  }): AuditEvent {
    return this.log({
      eventType: 'AUTH_PASSWORD_RESET_REQUEST',
      actorId: params.userId,
      actorType: params.userType,
      channel: params.channel,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Log successful password reset
   */
  logPasswordResetSuccess(params: {
    userId: string;
    userType: 'user' | 'candidate';
    channel: 'web' | 'mobile' | 'api';
    ipAddress?: string;
    userAgent?: string;
  }): AuditEvent {
    return this.log({
      eventType: 'AUTH_PASSWORD_RESET_SUCCESS',
      actorId: params.userId,
      actorType: params.userType,
      channel: params.channel,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Log MFA enrollment
   */
  logMfaEnrolled(params: {
    userId: string;
    userType: 'user' | 'candidate';
    channel: 'web' | 'mobile' | 'api';
    ipAddress?: string;
    userAgent?: string;
  }): AuditEvent {
    return this.log({
      eventType: 'AUTH_MFA_ENROLLED',
      actorId: params.userId,
      actorType: params.userType,
      channel: params.channel,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Log account lockout
   */
  logAccountLocked(params: {
    userId: string;
    userType: 'user' | 'candidate';
    reason: string;
    channel: 'web' | 'mobile' | 'api';
    ipAddress?: string;
  }): AuditEvent {
    return this.log({
      eventType: 'AUTH_ACCOUNT_LOCKED',
      actorType: 'system',
      targetId: params.userId,
      targetType: params.userType,
      channel: params.channel,
      ipAddress: params.ipAddress,
      metadata: { reason: params.reason },
    });
  }

  /**
   * Log anomaly detection
   */
  logAnomaly(params: {
    description: string;
    userId?: string;
    userType?: 'user' | 'candidate';
    channel: 'web' | 'mobile' | 'api';
    ipAddress?: string;
    metadata?: Record<string, unknown>;
  }): AuditEvent {
    return this.log({
      eventType: 'AUTH_ANOMALY_DETECTED',
      actorId: params.userId,
      actorType: params.userType,
      channel: params.channel,
      ipAddress: params.ipAddress,
      metadata: { description: params.description, ...params.metadata },
    });
  }

  /**
   * Get audit events for a user
   */
  getEventsForUser(userId: string, limit = 100): AuditLogEntry[] {
    return auditLog
      .filter((entry) => entry.event.actorId === userId || entry.event.targetId === userId)
      .slice(-limit);
  }

  /**
   * Get recent audit events
   */
  getRecentEvents(limit = 100): AuditLogEntry[] {
    return auditLog.slice(-limit);
  }
}

export const auditService = new AuditService();
