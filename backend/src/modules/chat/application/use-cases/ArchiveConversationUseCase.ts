/**
 * Archive Conversation Use Case
 */
import type {
  IChatRepository,
  IAuditService,
  IMetricsService,
  ChatOperationResult,
  ChatContext,
  Conversation,
} from '../../domain/index.js';

export class ArchiveConversationUseCase {
  constructor(
    private readonly repo: IChatRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(ctx: ChatContext, conversationId: string): Promise<ChatOperationResult<Conversation>> {
    const startTime = Date.now();
    try {
      const conversation = await this.repo.findConversationByIdForTenant(conversationId, ctx.tenantId);
      if (!conversation) {
        this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'archive', success: 'false' });
        return { success: false, error: 'Conversation not found', errorCode: 'CONVERSATION_NOT_FOUND' };
      }

      // Check permissions — only owner/admin can archive
      const role = await this.repo.getParticipantRole(conversationId, ctx.actorId, ctx.actorType);
      if (!role || !['owner', 'admin'].includes(role)) {
        this.audit.log({
          eventType: 'CONVERSATION_ACCESS_DENIED',
          actorId: ctx.actorId,
          actorType: ctx.actorType,
          targetId: conversationId,
          targetType: 'conversation',
          channel: ctx.channel,
          ipAddress: ctx.ipAddress,
          success: false,
          errorMessage: 'Insufficient permissions to archive',
        });
        this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'archive', success: 'false' });
        return { success: false, error: 'Insufficient permissions to archive conversation', errorCode: 'INSUFFICIENT_PERMISSIONS' };
      }

      const archived = await this.repo.updateConversationStatus(conversationId, 'archived');
      if (!archived) {
        this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'archive', success: 'false' });
        return { success: false, error: 'Failed to archive conversation', errorCode: 'ARCHIVE_ERROR' };
      }

      this.audit.log({
        eventType: 'CONVERSATION_ARCHIVED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: conversationId,
        targetType: 'conversation',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        success: true,
      });

      this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'archive', success: 'true' });
      return { success: true, data: archived };
    } catch (err) {
      this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'archive', success: 'false' });
      return { success: false, error: 'Failed to archive conversation', errorCode: 'ARCHIVE_ERROR' };
    }
  }
}
