/**
 * Get Thread Use Case
 */
import type {
  IChatRepository,
  IAuditService,
  IMetricsService,
  ChatOperationResult,
  ChatContext,
  MessageFilters,
  ChatPaginationOptions,
  MessageListResult,
} from '../../domain/index.js';

export class GetThreadUseCase {
  constructor(
    private readonly repo: IChatRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(
    ctx: ChatContext,
    conversationId: string,
    filters: MessageFilters,
    pagination: ChatPaginationOptions,
  ): Promise<ChatOperationResult<MessageListResult>> {
    const startTime = Date.now();
    try {
      const conversation = await this.repo.findConversationByIdForTenant(conversationId, ctx.tenantId);
      if (!conversation) {
        this.audit.log({
          eventType: 'CONVERSATION_ACCESS_DENIED',
          actorId: ctx.actorId,
          actorType: ctx.actorType,
          targetId: conversationId,
          targetType: 'conversation',
          channel: ctx.channel,
          ipAddress: ctx.ipAddress,
          success: false,
          errorMessage: 'Conversation not found',
        });
        this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'get_thread', success: 'false' });
        return { success: false, error: 'Conversation not found', errorCode: 'CONVERSATION_NOT_FOUND' };
      }

      const result = await this.repo.listMessagesForConversation(
        conversationId,
        ctx.tenantId,
        filters,
        pagination,
      );

      const limit = pagination.limit ?? 50;
      const hasMore = result.messages.length > limit;
      const messages = hasMore ? result.messages.slice(0, limit) : result.messages;

      this.audit.log({
        eventType: 'CONVERSATION_ACCESSED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: conversationId,
        targetType: 'conversation',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        success: true,
        metadata: { messageCount: messages.length },
      });

      this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'get_thread', success: 'true' });
      return { success: true, data: { messages, total: result.total, hasMore, nextCursor: undefined } };
    } catch (err) {
      this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'get_thread', success: 'false' });
      return { success: false, error: 'Failed to retrieve messages', errorCode: 'THREAD_READ_ERROR' };
    }
  }
}
