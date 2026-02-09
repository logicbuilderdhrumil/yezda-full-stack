/**
 * Send Message Use Case
 */
import type {
  IChatRepository,
  IAuditService,
  IMetricsService,
  ChatOperationResult,
  ChatContext,
  Message,
  MessageContentType,
} from '../../domain/index.js';
import { calculateMessageExpirationDate } from '../../domain/index.js';

export class SendMessageUseCase {
  constructor(
    private readonly repo: IChatRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(
    ctx: ChatContext,
    conversationId: string,
    content: string,
    contentType?: MessageContentType,
    attachmentId?: string,
    metadata?: Record<string, unknown>,
  ): Promise<ChatOperationResult<Message>> {
    const startTime = Date.now();
    try {
      const conversation = await this.repo.findConversationByIdForTenant(conversationId, ctx.tenantId);
      if (!conversation) {
        this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'send_message', success: 'false' });
        return { success: false, error: 'Conversation not found', errorCode: 'CONVERSATION_NOT_FOUND' };
      }

      const expiresAt = calculateMessageExpirationDate(conversation.status);
      const message = await this.repo.createMessage(
        {
          conversationId,
          tenantId: ctx.tenantId,
          senderId: ctx.actorId,
          senderType: ctx.actorType,
          content,
          contentType,
          attachmentId,
          metadata,
        },
        expiresAt,
      );

      this.audit.log({
        eventType: 'MESSAGE_SENT',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: message.id,
        targetType: 'message',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        success: true,
        metadata: { conversationId, contentType: contentType ?? 'text' },
      });

      this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'send_message', success: 'true' });
      return { success: true, data: message };
    } catch (err) {
      this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'send_message', success: 'false' });
      return { success: false, error: 'Failed to send message', errorCode: 'MESSAGE_SEND_ERROR' };
    }
  }
}
