/**
 * Get Unread Count Use Case
 */
import type { INotificationRepository, IMetricsService, NotificationOperationResult, NotificationContext } from '../../domain/index.js';

export class GetUnreadCountUseCase {
  constructor(private readonly repo: INotificationRepository, private readonly metrics: IMetricsService) {}

  async execute(ctx: NotificationContext): Promise<NotificationOperationResult<{ count: number }>> {
    const t = Date.now();
    try {
      const count = await this.repo.getUnreadCount(ctx.tenantId, ctx.actorId, ctx.actorType);
      this.metrics.recordLatency('notification_request', Date.now() - t, { operation: 'unread_count', success: 'true' });
      return { success: true, data: { count } };
    } catch (err) {
      this.metrics.recordLatency('notification_request', Date.now() - t, { operation: 'unread_count', success: 'false' });
      return { success: false, error: 'Failed to get unread count', errorCode: 'NOTIFICATION_COUNT_ERROR' };
    }
  }
}
