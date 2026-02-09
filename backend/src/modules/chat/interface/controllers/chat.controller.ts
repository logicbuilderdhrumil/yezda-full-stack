/**
 * Chat Controller
 *
 * Thin HTTP adapter — delegates to use cases via constructor-injected dependencies.
 */
import type { Request, Response } from 'express';
import type { CreateConversationUseCase } from '../../application/use-cases/CreateConversationUseCase.js';
import type { ListConversationsUseCase } from '../../application/use-cases/ListConversationsUseCase.js';
import type { GetThreadUseCase } from '../../application/use-cases/GetThreadUseCase.js';
import type { SendMessageUseCase } from '../../application/use-cases/SendMessageUseCase.js';
import type { MarkMessageDeliveredUseCase } from '../../application/use-cases/MarkMessageDeliveredUseCase.js';
import type { MarkMessageReadUseCase } from '../../application/use-cases/MarkMessageReadUseCase.js';
import type { ArchiveConversationUseCase } from '../../application/use-cases/ArchiveConversationUseCase.js';
import type { ChatContext, ConversationFilters, MessageFilters, ChatPaginationOptions, MessageContentType } from '../../domain/index.js';

interface AuthenticatedRequest extends Request {
  user?: { sub: string; type: 'user' | 'candidate'; tenantId?: string; roles?: string[] };
}

function buildContext(req: AuthenticatedRequest): ChatContext {
  const tenantId = req.user?.tenantId || req.get('x-tenant-id');
  if (!tenantId) {
    throw Object.assign(new Error('Tenant ID is required'), { status: 400 });
  }
  return {
    actorId: req.user!.sub,
    actorType: req.user!.type,
    tenantId,
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    channel: (req.get('x-channel') || 'api') as 'web' | 'mobile' | 'api',
  };
}

export class ChatController {
  constructor(
    private readonly createConvUC: CreateConversationUseCase,
    private readonly listConvsUC: ListConversationsUseCase,
    private readonly getThreadUC: GetThreadUseCase,
    private readonly sendMessageUC: SendMessageUseCase,
    private readonly markDeliveredUC: MarkMessageDeliveredUseCase,
    private readonly markReadUC: MarkMessageReadUseCase,
    private readonly archiveConvUC: ArchiveConversationUseCase,
  ) {}

  createConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' }); return; }
    const ctx = buildContext(req);
    const result = await this.createConvUC.execute(ctx, { title: req.body.title, participantIds: req.body.participantIds, metadata: req.body.metadata });
    if (!result.success) { res.status(500).json({ error: result.error, code: result.errorCode }); return; }
    res.status(201).json(result.data);
  };

  listConversations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' }); return; }
    const ctx = buildContext(req);
    const filters: ConversationFilters = { status: req.query.status as ConversationFilters['status'] };
    const pagination: ChatPaginationOptions = {
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      cursor: req.query.cursor as string | undefined,
    };
    const result = await this.listConvsUC.execute(ctx, filters, pagination);
    if (!result.success) { res.status(500).json({ error: result.error, code: result.errorCode }); return; }
    res.status(200).json({ conversations: result.data!.conversations, meta: { total: result.data!.total } });
  };

  getThread = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' }); return; }
    const ctx = buildContext(req);
    const { conversationId } = req.params;
    const filters: MessageFilters = {
      since: req.query.since ? new Date(req.query.since as string) : undefined,
      before: req.query.before ? new Date(req.query.before as string) : undefined,
    };
    const pagination: ChatPaginationOptions = {
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      cursor: req.query.cursor as string | undefined,
    };
    const result = await this.getThreadUC.execute(ctx, conversationId, filters, pagination);
    if (!result.success) {
      const status = result.errorCode === 'CONVERSATION_NOT_FOUND' ? 404 : 500;
      res.status(status).json({ error: result.error, code: result.errorCode }); return;
    }
    res.status(200).json({ messages: result.data!.messages, meta: { total: result.data!.total } });
  };

  sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' }); return; }
    const ctx = buildContext(req);
    const { conversationId } = req.params;
    const result = await this.sendMessageUC.execute(ctx, conversationId, req.body.content, req.body.contentType as MessageContentType | undefined, req.body.attachmentId, req.body.metadata);
    if (!result.success) {
      const status = result.errorCode === 'CONVERSATION_NOT_FOUND' ? 404 : 500;
      res.status(status).json({ error: result.error, code: result.errorCode }); return;
    }
    res.status(201).json(result.data);
  };

  markMessageDelivered = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' }); return; }
    const ctx = buildContext(req);
    const { id } = req.params;
    const result = await this.markDeliveredUC.execute(ctx, id);
    if (!result.success) {
      const status = result.errorCode === 'MESSAGE_NOT_FOUND' ? 404 : 500;
      res.status(status).json({ error: result.error, code: result.errorCode }); return;
    }
    res.status(200).json(result.data);
  };

  markMessageRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' }); return; }
    const ctx = buildContext(req);
    const { id } = req.params;
    const result = await this.markReadUC.execute(ctx, id);
    if (!result.success) {
      const status = result.errorCode === 'MESSAGE_NOT_FOUND' ? 404 : 500;
      res.status(status).json({ error: result.error, code: result.errorCode }); return;
    }
    res.status(200).json(result.data);
  };

  archiveConversation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' }); return; }
    const ctx = buildContext(req);
    const { conversationId } = req.params;
    const result = await this.archiveConvUC.execute(ctx, conversationId);
    if (!result.success) {
      let status = 500;
      if (result.errorCode === 'CONVERSATION_NOT_FOUND') status = 404;
      if (result.errorCode === 'INSUFFICIENT_PERMISSIONS') status = 403;
      res.status(status).json({ error: result.error, code: result.errorCode }); return;
    }
    res.status(200).json(result.data);
  };
}
