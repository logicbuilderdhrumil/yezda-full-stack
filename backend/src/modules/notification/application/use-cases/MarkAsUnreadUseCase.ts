/**
 * Mark As Unread Use Case
 */
import type { INotificationRepository, IAuditService, IMetricsService, NotificationOperationResult, NotificationContext, Notification } from '../../domain/index.js';

export class MarkAsUnreadUseCase {
  constructor(private readonly repo: INotificationRepository, private readonly audit: IAuditService, private readonly metrics: IMetricsService) {}

  async execute(ctx: NotificationContext, notificationId: string): Promise<NotificationOperationResult<Notification>> {
    const t = Date.now();
    try {
      const n = await this.repo.findByIdForUser(notificationId, ctx.tenantId, ctx.actorId, ctx.actorType);
      if (!n) {
        this.metrics.recordLatency('notification_request', Date.now() - t, { operation: 'mark_unread', success: 'false' });
        return { success: false, error: 'Notification not found', errorCode: 'NOTIFICATION_NOT_FOUND' };
      }
      const updated = await this.repo.updateStatus(notificationId, 'unread');
      this.audit.log({ eventType: 'NOTIFICATION_UNREAD', actorId: ctx.actorId, actorType: ctx.actorType, targetId: notificationId, targetType: 'notification', channel: ctx.channel, ipAddress: ctx.ipAddress, success: true });
      this.metrics.recordLatency('notification_request', Date.now() - t, { operation: 'mark_unread', success: 'true' });
      return { success: true, data: updated ?? n };
    } catch {
      this.metrics.recordLatency('notification_request', Date.now() - t, { operation: 'mark_unread', success: 'false' });
      return { success: false, error: 'Failed to mark as unread', errorCode: 'NOTIFICATION_UPDATE_ERROR' };
    }
  }
}
