/**
 * Audit Log Repository
 * Postgres persistence for authentication audit trail
 */

import { query } from '../db/postgres.js';
import type { AuditEventType, AuditLogEntry } from '../models/audit.model.js';

type AuditLogRow = {
  id: string;
  event_type: AuditEventType;
  actor_id: string | null;
  actor_type: 'user' | 'candidate' | 'system' | null;
  target_id: string | null;
  target_type: string | null;
  channel: 'web' | 'mobile' | 'api';
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  success: boolean;
  error_message: string | null;
  timestamp: Date;
};

function rowToEntry(row: AuditLogRow): AuditLogEntry {
  return {
    event: {
      id: row.id,
      eventType: row.event_type,
      actorId: row.actor_id ?? undefined,
      actorType: row.actor_type ?? undefined,
      targetId: row.target_id ?? undefined,
      targetType: row.target_type ?? undefined,
      channel: row.channel,
      ipAddress: row.ip_address ?? undefined,
      userAgent: row.user_agent ?? undefined,
      metadata: row.metadata ?? undefined,
      timestamp: row.timestamp,
    },
    success: row.success,
    errorMessage: row.error_message ?? undefined,
  };
}

export class AuditLogRepository {
  async create(entry: AuditLogEntry): Promise<void> {
    const params = [
        entry.event.id,
        entry.event.eventType,
        entry.event.actorId ?? null,
        entry.event.actorType ?? null,
        entry.event.targetId ?? null,
        entry.event.targetType ?? null,
        entry.event.channel,
        entry.event.ipAddress ?? null,
        entry.event.userAgent ?? null,
        entry.event.metadata ? JSON.stringify(entry.event.metadata) : null,
        entry.success,
        entry.errorMessage ?? null,
        entry.event.timestamp,
      ];
    await query(
      `INSERT INTO audit_logs (id, event_type, actor_id, actor_type, target_id, target_type, channel, ip_address, user_agent, metadata, success, error_message, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      params
    );
  }

  async findByActor(actorId: string, limit = 100): Promise<AuditLogEntry[]> {
    const result = await query<AuditLogRow>(
      `SELECT * FROM audit_logs 
       WHERE actor_id = $1 OR target_id = $1
       ORDER BY timestamp DESC LIMIT $2`,
      [actorId, limit]
    );
    return result.rows.map(rowToEntry);
  }

  async findRecent(limit = 100): Promise<AuditLogEntry[]> {
    const result = await query<AuditLogRow>(
      'SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT $1',
      [limit]
    );
    return result.rows.map(rowToEntry);
  }

  async findByEventType(
    eventType: AuditEventType,
    limit = 100
  ): Promise<AuditLogEntry[]> {
    const result = await query<AuditLogRow>(
      'SELECT * FROM audit_logs WHERE event_type = $1 ORDER BY timestamp DESC LIMIT $2',
      [eventType, limit]
    );
    return result.rows.map(rowToEntry);
  }

  async countByEventType(
    eventType: AuditEventType,
    sinceMs: number
  ): Promise<number> {
    const since = new Date(Date.now() - sinceMs);
    const result = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM audit_logs WHERE event_type = $1 AND timestamp > $2',
      [eventType, since]
    );
    return parseInt(result.rows[0]?.count ?? '0', 10);
  }

  async cleanupOld(retentionDays = 90): Promise<number> {
    const result = await query(
      `DELETE FROM audit_logs WHERE timestamp < NOW() - INTERVAL '1 day' * $1`,
      [retentionDays]
    );
    return result.rowCount ?? 0;
  }
}

export const auditLogRepository = new AuditLogRepository();
