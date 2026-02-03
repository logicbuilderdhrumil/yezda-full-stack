/**
 * Audit Service
 * Task 1.7: Record audit events for authentication and recovery activities
 * 
 * Uses Postgres for durable audit log storage.
 */

import { v4 as uuidv4 } from 'uuid';
import type { AuditEvent, AuditEventType, AuditLogEntry } from '../models/audit.model.js';
import { auditLogRepository } from '../repositories/audit-log.repository.js';

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

    // Persist to database asynchronously (fire and forget)
    auditLogRepository.create(entry).catch((err) => {
      console.error('[Audit] Failed to persist audit log:', err);
    });

    // Console log for observability
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
  async getEventsForUser(userId: string, limit = 100): Promise<AuditLogEntry[]> {
    return auditLogRepository.findByActor(userId, limit);
  }

  /**
   * Get recent audit events
   */
  async getRecentEvents(limit = 100): Promise<AuditLogEntry[]> {
    return auditLogRepository.findRecent(limit);
  }
}

export const auditService = new AuditService();
