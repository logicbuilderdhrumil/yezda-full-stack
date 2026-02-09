/**
 * Postgres Notification Repository
 */
import type { INotificationRepository } from '../../domain/ports/notification-repository.port.js';
import type { Notification, CreateNotificationDto, NotificationFilters, NotificationPaginationOptions, NotificationStatus } from '../../domain/entities/notification.entity.js';
import { query } from '../../../../shared/infrastructure/database/index.js';
import { randomUUID } from 'crypto';

interface NotificationRow {
  id: string; tenant_id: string; user_id: string; user_type: 'user' | 'candidate';
  type: Notification['type']; priority: Notification['priority']; title: string; body: string;
  status: NotificationStatus; action_url: string | null; metadata: Record<string, unknown> | null;
  created_at: Date; read_at: Date | null; expires_at: Date | null;
}

function rowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id, tenantId: row.tenant_id, userId: row.user_id, userType: row.user_type,
    type: row.type, priority: row.priority, title: row.title, body: row.body,
    status: row.status, actionUrl: row.action_url ?? undefined,
    metadata: row.metadata ?? undefined, createdAt: row.created_at,
    readAt: row.read_at ?? undefined, expiresAt: row.expires_at ?? undefined,
  };
}

export class PostgresNotificationRepository implements INotificationRepository {
  async create(input: CreateNotificationDto, expiresAt: Date): Promise<Notification> {
    const id = randomUUID();
    const now = new Date();
    const result = await query<NotificationRow>(
      `INSERT INTO notifications (id,tenant_id,user_id,user_type,type,priority,title,body,status,action_url,metadata,created_at,expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'unread',$9,$10,$11,$12) RETURNING *`,
      [id, input.tenantId, input.userId, input.userType, input.type, input.priority ?? 'normal', input.title, input.body, input.actionUrl ?? null, input.metadata ? JSON.stringify(input.metadata) : null, now, expiresAt],
    );
    return rowToNotification(result.rows[0]);
  }

  async findById(id: string): Promise<Notification | undefined> {
    const result = await query<NotificationRow>('SELECT * FROM notifications WHERE id = $1', [id]);
    return result.rows[0] ? rowToNotification(result.rows[0]) : undefined;
  }

  async findByIdForUser(id: string, tenantId: string, userId: string, userType: 'user' | 'candidate'): Promise<Notification | undefined> {
    const result = await query<NotificationRow>('SELECT * FROM notifications WHERE id=$1 AND tenant_id=$2 AND user_id=$3 AND user_type=$4', [id, tenantId, userId, userType]);
    return result.rows[0] ? rowToNotification(result.rows[0]) : undefined;
  }

  async list(tenantId: string, userId: string, userType: 'user' | 'candidate', filters: NotificationFilters, pagination: NotificationPaginationOptions): Promise<{ notifications: Notification[]; total: number }> {
    const limit = Math.min(pagination.limit ?? 20, 100);
    const conds: string[] = ['tenant_id=$1', 'user_id=$2', 'user_type=$3'];
    const params: unknown[] = [tenantId, userId, userType];
    let idx = 4;
    if (filters.status) { conds.push(`status=$${idx++}`); params.push(filters.status); }
    if (filters.type) { conds.push(`type=$${idx++}`); params.push(filters.type); }
    if (filters.priority) { conds.push(`priority=$${idx++}`); params.push(filters.priority); }
    if (filters.since) { conds.push(`created_at>=$${idx++}`); params.push(filters.since); }
    if (pagination.cursor) { conds.push(`created_at<$${idx++}`); params.push(new Date(pagination.cursor)); }
    const where = conds.join(' AND ');
    const countResult = await query<{ count: string }>(`SELECT COUNT(*) as count FROM notifications WHERE ${conds.filter(c => !c.includes('created_at<')).join(' AND ')}`, params.slice(0, idx - (pagination.cursor ? 1 : 0)));
    const total = parseInt(countResult.rows[0].count, 10);
    params.push(limit + 1);
    const result = await query<NotificationRow>(`SELECT * FROM notifications WHERE ${where} ORDER BY created_at DESC LIMIT $${idx}`, params);
    const notifications = result.rows.slice(0, limit).map(rowToNotification);
    return { notifications, total };
  }

  async updateStatus(id: string, status: NotificationStatus, readAt?: Date): Promise<Notification | undefined> {
    const result = await query<NotificationRow>('UPDATE notifications SET status=$1, read_at=$2 WHERE id=$3 RETURNING *', [status, readAt ?? null, id]);
    return result.rows[0] ? rowToNotification(result.rows[0]) : undefined;
  }

  async markManyAsRead(tenantId: string, userId: string, userType: 'user' | 'candidate', ids?: string[]): Promise<number> {
    const now = new Date();
    if (ids && ids.length > 0) {
      const placeholders = ids.map((_, i) => `$${i + 5}`).join(',');
      const result = await query(`UPDATE notifications SET status='read', read_at=$1 WHERE tenant_id=$2 AND user_id=$3 AND user_type=$4 AND id IN (${placeholders}) AND status='unread'`, [now, tenantId, userId, userType, ...ids]);
      return result.rowCount ?? 0;
    }
    const result = await query(`UPDATE notifications SET status='read', read_at=$1 WHERE tenant_id=$2 AND user_id=$3 AND user_type=$4 AND status='unread'`, [now, tenantId, userId, userType]);
    return result.rowCount ?? 0;
  }

  async getUnreadCount(tenantId: string, userId: string, userType: 'user' | 'candidate'): Promise<number> {
    const result = await query<{ count: string }>(`SELECT COUNT(*) as count FROM notifications WHERE tenant_id=$1 AND user_id=$2 AND user_type=$3 AND status='unread'`, [tenantId, userId, userType]);
    return parseInt(result.rows[0].count, 10);
  }

  async cleanupExpired(): Promise<number> {
    const result = await query('DELETE FROM notifications WHERE expires_at IS NOT NULL AND expires_at < NOW()');
    return result.rowCount ?? 0;
  }
}
