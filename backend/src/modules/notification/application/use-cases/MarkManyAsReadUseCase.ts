/**
 * Mark Many As Read Use Case
 */
import type { INotificationRepository, IAuditService, IMetricsService, NotificationOperationResult, NotificationContext } from '../../domain/index.js';

export class MarkManyAsReadUseCase {
  constructor(private readonly repo: INotificationRepository, private readonly audit: IAuditService, private readonly metrics: IMetricsService) {}

  async execute(ctx: NotificationContext, ids?: string[]): Promise<NotificationOperationResult<{ count: number }>> {
    const t = Date.now();
    try {
      const count = await this.repo.markManyAsRead(ctx.tenantId, ctx.actorId, ctx.actorType, ids);
      this.audit.log({ eventType: 'NOTIFICATION_BATCH_MARKED_READ', actorId: ctx.actorId, actorType: ctx.actorType, channel: ctx.channel, ipAddress: ctx.ipAddress, success: true, metadata: { count, specificIds: !!ids } });
      this.metrics.recordLatency('notification_request', Date.now() - t, { operation: 'mark_many_read', success: 'true' });
      return { success: true, data: { count } };
    } catch (err) {
      this.metrics.recordLatency('notification_request', Date.now() - t, { operation: 'mark_many_read', success: 'false' });
      return { success: false, error: 'Failed to mark notifications as read', errorCode: 'NOTIFICATION_BATCH_ERROR' };
    }
  }
}
