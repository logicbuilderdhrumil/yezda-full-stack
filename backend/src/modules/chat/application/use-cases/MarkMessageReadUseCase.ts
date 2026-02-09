/**
 * Mark Message Read Use Case
 */
import type {
  IChatRepository,
  IAuditService,
  IMetricsService,
  ChatOperationResult,
  ChatContext,
  Message,
} from '../../domain/index.js';

export class MarkMessageReadUseCase {
  constructor(
    private readonly repo: IChatRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(ctx: ChatContext, messageId: string): Promise<ChatOperationResult<Message>> {
    const startTime = Date.now();
    try {
      const updated = await this.repo.markMessageAsRead(messageId, ctx.actorId);
      if (!updated) {
        this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'mark_read', success: 'false' });
        return { success: false, error: 'Message not found', errorCode: 'MESSAGE_NOT_FOUND' };
      }

      this.audit.log({
        eventType: 'MESSAGE_READ',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: messageId,
        targetType: 'message',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        success: true,
      });

      this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'mark_read', success: 'true' });
      return { success: true, data: updated };
    } catch (err) {
      this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'mark_read', success: 'false' });
      return { success: false, error: 'Failed to mark message as read', errorCode: 'MESSAGE_READ_ERROR' };
    }
  }
}
