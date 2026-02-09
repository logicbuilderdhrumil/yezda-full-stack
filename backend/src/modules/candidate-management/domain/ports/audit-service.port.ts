/**
 * Audit Service Port
 * Domain interface for audit logging (implemented by legacy auditService).
 */

export interface AuditLogEntry {
  eventType: string;
  actorId?: string;
  actorType?: string;
  targetId?: string;
  targetType?: string;
  channel?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  success?: boolean;
  errorMessage?: string;
}

export interface IAuditService {
  log(entry: AuditLogEntry): void;
}
