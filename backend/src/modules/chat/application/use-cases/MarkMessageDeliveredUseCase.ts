/**
 * Mark Message Delivered Use Case
 */
import type {
  IChatRepository,
  IAuditService,
  IMetricsService,
  ChatOperationResult,
  ChatContext,
  Message,
} from '../../domain/index.js';

export class MarkMessageDeliveredUseCase {
  constructor(
    private readonly repo: IChatRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(ctx: ChatContext, messageId: string): Promise<ChatOperationResult<Message>> {
    const startTime = Date.now();
    try {
      const updated = await this.repo.updateMessageStatus(messageId, 'delivered', new Date());
      if (!updated) {
        this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'mark_delivered', success: 'false' });
        return { success: false, error: 'Message not found', errorCode: 'MESSAGE_NOT_FOUND' };
      }

      this.audit.log({
        eventType: 'MESSAGE_DELIVERED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: messageId,
        targetType: 'message',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        success: true,
      });

      this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'mark_delivered', success: 'true' });
      return { success: true, data: updated };
    } catch {
      this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'mark_delivered', success: 'false' });
      return { success: false, error: 'Failed to mark message as delivered', errorCode: 'MESSAGE_DELIVERY_ERROR' };
    }
  }
}
