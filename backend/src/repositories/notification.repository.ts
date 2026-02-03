/**
 * Notification Repository
 * Task 1.2, 1.3: Postgres persistence for notifications
 */

import { query } from '../db/postgres.js';
import type {
  Notification,
  CreateNotificationInput,
  NotificationFilters,
  NotificationPaginationOptions,
  NotificationStatus,
} from '../models/notification.model.js';
import { randomUUID } from 'crypto';

type NotificationRow = {
  id: string;
  tenant_id: string;
  user_id: string;
  user_type: 'user' | 'candidate';
  type: Notification['type'];
  priority: Notification['priority'];
  title: string;
  body: string;
  status: NotificationStatus;
  action_url: string | null;
  metadata: Record<string, unknown> | null;
  created_at: Date;
  read_at: Date | null;
  expires_at: Date;
};

function rowToNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    userId: row.user_id,
    userType: row.user_type,
    type: row.type,
    priority: row.priority,
    title: row.title,
    body: row.body,
    status: row.status,
    actionUrl: row.action_url ?? undefined,
    metadata: row.metadata ?? undefined,
    createdAt: row.created_at,
    readAt: row.read_at ?? undefined,
    expiresAt: row.expires_at,
  };
}

export class NotificationRepository {
  /**
   * Create a new notification
   */
  async create(input: CreateNotificationInput, expiresAt: Date): Promise<Notification> {
    const id = randomUUID();
    const now = new Date();

    const result = await query<NotificationRow>(
      `INSERT INTO notifications (id, tenant_id, user_id, user_type, type, priority, title, body, status, action_url, metadata, created_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'unread', $9, $10, $11, $12)
       RETURNING *`,
      [
        id,
        input.tenantId,
        input.userId,
        input.userType,
        input.type,
        input.priority ?? 'normal',
        input.title,
        input.body,
        input.actionUrl ?? null,
        input.metadata ? JSON.stringify(input.metadata) : null,
        now,
        expiresAt,
      ]
    );

    return rowToNotification(result.rows[0]);
  }

  /**
   * Find notification by ID
   */
  async findById(id: string): Promise<Notification | undefined> {
    const result = await query<NotificationRow>(
      'SELECT * FROM notifications WHERE id = $1',
      [id]
    );
    return result.rows[0] ? rowToNotification(result.rows[0]) : undefined;
  }

  /**
   * Find notification by ID with tenant verification
   */
  async findByIdForUser(
    id: string,
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<Notification | undefined> {
    const result = await query<NotificationRow>(
      `SELECT * FROM notifications 
       WHERE id = $1 AND tenant_id = $2 AND user_id = $3 AND user_type = $4`,
      [id, tenantId, userId, userType]
    );
    return result.rows[0] ? rowToNotification(result.rows[0]) : undefined;
  }

  /**
   * List notifications for a user with filters and pagination
   */
  async listForUser(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    filters: NotificationFilters = {},
    pagination: NotificationPaginationOptions = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    const limit = Math.min(pagination.limit ?? 20, 100);
    const conditions: string[] = ['tenant_id = $1', 'user_id = $2', 'user_type = $3', 'expires_at > NOW()'];
    const params: unknown[] = [tenantId, userId, userType];
    let paramIndex = 4;

    if (filters.status) {
      conditions.push(`status = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.type) {
      conditions.push(`type = $${paramIndex}`);
      params.push(filters.type);
      paramIndex++;
    }

    if (filters.priority) {
      conditions.push(`priority = $${paramIndex}`);
      params.push(filters.priority);
      paramIndex++;
    }

    if (filters.since) {
      conditions.push(`created_at > $${paramIndex}`);
      params.push(filters.since);
      paramIndex++;
    }

    if (pagination.cursor) {
      conditions.push(`created_at < $${paramIndex}`);
      params.push(new Date(pagination.cursor));
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM notifications WHERE ${whereClause.replace(` AND created_at < $${paramIndex - 1}`, '')}`,
      pagination.cursor ? params.slice(0, -1) : params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    params.push(limit + 1); // Fetch one extra to determine hasMore
    const result = await query<NotificationRow>(
      `SELECT * FROM notifications 
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex}`,
      params
    );

    const notifications = result.rows.slice(0, limit).map(rowToNotification);

    return { notifications, total };
  }

  /**
   * Update notification status
   */
  async updateStatus(
    id: string,
    status: NotificationStatus
  ): Promise<boolean> {
    const readAt = status === 'read' ? new Date() : null;
    const result = await query(
      `UPDATE notifications SET status = $1, read_at = $2 WHERE id = $3`,
      [status, readAt, id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Mark multiple notifications as read
   */
  async markManyAsRead(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    ids?: string[]
  ): Promise<number> {
    if (ids && ids.length > 0) {
      const result = await query(
        `UPDATE notifications 
         SET status = 'read', read_at = NOW() 
         WHERE tenant_id = $1 AND user_id = $2 AND user_type = $3 
         AND id = ANY($4) AND status = 'unread'`,
        [tenantId, userId, userType, ids]
      );
      return result.rowCount ?? 0;
    }

    // Mark all as read
    const result = await query(
      `UPDATE notifications 
       SET status = 'read', read_at = NOW() 
       WHERE tenant_id = $1 AND user_id = $2 AND user_type = $3 AND status = 'unread'`,
      [tenantId, userId, userType]
    );
    return result.rowCount ?? 0;
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<number> {
    const result = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM notifications 
       WHERE tenant_id = $1 AND user_id = $2 AND user_type = $3 
       AND status = 'unread' AND expires_at > NOW()`,
      [tenantId, userId, userType]
    );
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Delete a notification
   */
  async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM notifications WHERE id = $1',
      [id]
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Delete expired notifications (cleanup job)
   */
  async cleanupExpired(): Promise<number> {
    const result = await query(
      'DELETE FROM notifications WHERE expires_at < NOW()'
    );
    return result.rowCount ?? 0;
  }

  /**
   * Verify tenant ownership for a notification
   */
  async verifyTenantOwnership(
    id: string,
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<boolean> {
    const result = await query<{ exists: boolean }>(
      `SELECT EXISTS(
        SELECT 1 FROM notifications 
        WHERE id = $1 AND tenant_id = $2 AND user_id = $3 AND user_type = $4
      ) as exists`,
      [id, tenantId, userId, userType]
    );
    return result.rows[0]?.exists ?? false;
  }
}

export const notificationRepository = new NotificationRepository();
