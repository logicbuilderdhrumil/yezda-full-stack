/**
 * Get Notification Use Case
 */
import type { INotificationRepository, IAuditService, IMetricsService, NotificationOperationResult, NotificationContext, Notification } from '../../domain/index.js';

export class GetNotificationUseCase {
  constructor(private readonly repo: INotificationRepository, private readonly audit: IAuditService, private readonly metrics: IMetricsService) {}

  async execute(ctx: NotificationContext, notificationId: string): Promise<NotificationOperationResult<Notification>> {
    const t = Date.now();
    try {
      const n = await this.repo.findByIdForUser(notificationId, ctx.tenantId, ctx.actorId, ctx.actorType);
      if (!n) {
        this.audit.log({ eventType: 'NOTIFICATION_ACCESS_DENIED', actorId: ctx.actorId, actorType: ctx.actorType, targetId: notificationId, targetType: 'notification', channel: ctx.channel, ipAddress: ctx.ipAddress, success: false, errorMessage: 'Not found' });
        this.metrics.recordLatency('notification_request', Date.now() - t, { operation: 'get', success: 'false' });
        return { success: false, error: 'Notification not found', errorCode: 'NOTIFICATION_NOT_FOUND' };
      }
      this.audit.log({ eventType: 'NOTIFICATION_DETAIL_ACCESSED', actorId: ctx.actorId, actorType: ctx.actorType, targetId: notificationId, targetType: 'notification', channel: ctx.channel, ipAddress: ctx.ipAddress, success: true });
      this.metrics.recordLatency('notification_request', Date.now() - t, { operation: 'get', success: 'true' });
      return { success: true, data: n };
    } catch (err) {
      this.metrics.recordLatency('notification_request', Date.now() - t, { operation: 'get', success: 'false' });
      return { success: false, error: `Failed to get notification: ${err instanceof Error ? err.message : String(err)}`, errorCode: 'NOTIFICATION_READ_ERROR' };
    }
  }
}
