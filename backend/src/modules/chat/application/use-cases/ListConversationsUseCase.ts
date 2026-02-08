/**
 * List Conversations Use Case
 */
import type {
  IChatRepository,
  IAuditService,
  IMetricsService,
  ChatOperationResult,
  ChatContext,
  ConversationFilters,
  ChatPaginationOptions,
  ConversationListResult,
} from '../../domain/index.js';

export class ListConversationsUseCase {
  constructor(
    private readonly repo: IChatRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(
    ctx: ChatContext,
    filters: ConversationFilters,
    pagination: ChatPaginationOptions,
  ): Promise<ChatOperationResult<ConversationListResult>> {
    const startTime = Date.now();
    try {
      const result = await this.repo.listConversationsForUser(
        ctx.tenantId,
        ctx.actorId,
        ctx.actorType,
        filters,
        pagination,
      );

      const limit = pagination.limit ?? 20;
      const hasMore = result.conversations.length > limit;
      const conversations = hasMore ? result.conversations.slice(0, limit) : result.conversations;

      this.audit.log({
        eventType: 'CONVERSATION_LIST_ACCESSED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        success: true,
        metadata: { count: conversations.length, total: result.total },
      });

      this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'list_conversations', success: 'true' });
      return { success: true, data: { conversations, total: result.total, hasMore, nextCursor: undefined } };
    } catch {
      this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'list_conversations', success: 'false' });
      return { success: false, error: 'Failed to list conversations', errorCode: 'CONVERSATION_LIST_ERROR' };
    }
  }
}
