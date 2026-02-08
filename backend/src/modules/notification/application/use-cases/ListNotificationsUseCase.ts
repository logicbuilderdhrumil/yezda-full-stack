/**
 * List Notifications Use Case
 */
import type { INotificationRepository, IAuditService, IMetricsService, NotificationOperationResult, NotificationContext, NotificationFilters, NotificationPaginationOptions, NotificationListResult } from '../../domain/index.js';

export class ListNotificationsUseCase {
  constructor(private readonly repo: INotificationRepository, private readonly audit: IAuditService, private readonly metrics: IMetricsService) {}

  async execute(ctx: NotificationContext, filters: NotificationFilters, pagination: NotificationPaginationOptions): Promise<NotificationOperationResult<NotificationListResult>> {
    const t = Date.now();
    try {
      const result = await this.repo.list(ctx.tenantId, ctx.actorId, ctx.actorType, filters, pagination);
      const limit = pagination.limit ?? 20;
      const hasMore = result.notifications.length > limit;
      const notifications = hasMore ? result.notifications.slice(0, limit) : result.notifications;
      this.audit.log({ eventType: 'NOTIFICATION_LIST_ACCESSED', actorId: ctx.actorId, actorType: ctx.actorType, channel: ctx.channel, ipAddress: ctx.ipAddress, success: true, metadata: { count: notifications.length, total: result.total } });
      this.metrics.recordLatency('notification_request', Date.now() - t, { operation: 'list', success: 'true' });
      return { success: true, data: { notifications, total: result.total, hasMore, nextCursor: undefined } };
    } catch {
      this.metrics.recordLatency('notification_request', Date.now() - t, { operation: 'list', success: 'false' });
      return { success: false, error: 'Failed to list notifications', errorCode: 'NOTIFICATION_LIST_ERROR' };
    }
  }
}
