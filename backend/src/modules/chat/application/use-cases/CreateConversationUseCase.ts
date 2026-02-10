/**
 * Create Conversation Use Case
 */
import type {
  IChatRepository,
  IAuditService,
  IMetricsService,
  ChatOperationResult,
  ChatContext,
  CreateConversationInput,
  Conversation,
} from '../../domain/index.js';

export class CreateConversationUseCase {
  constructor(
    private readonly repo: IChatRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(ctx: ChatContext, input: Omit<CreateConversationInput, 'tenantId'>): Promise<ChatOperationResult<Conversation>> {
    const startTime = Date.now();
    try {
      const conversation = await this.repo.createConversation({
        ...input,
        tenantId: ctx.tenantId,
      });

      this.audit.log({
        eventType: 'CONVERSATION_CREATED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: conversation.id,
        targetType: 'conversation',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        success: true,
        metadata: { participantCount: input.participantIds.length },
      });

      this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'create_conversation', success: 'true' });
      return { success: true, data: conversation };
    } catch (err) {
      this.metrics.recordLatency('chat_request', Date.now() - startTime, { operation: 'create_conversation', success: 'false' });
      return { success: false, error: `Failed to create conversation: ${err instanceof Error ? err.message : String(err)}`, errorCode: 'CONVERSATION_CREATE_ERROR' };
    }
  }
}
