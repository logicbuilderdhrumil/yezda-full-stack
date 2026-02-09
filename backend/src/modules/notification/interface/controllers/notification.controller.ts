/**
 * Notification Controller
 */
import type { Request, Response } from 'express';
import type { ListNotificationsUseCase } from '../../application/use-cases/ListNotificationsUseCase.js';
import type { GetNotificationUseCase } from '../../application/use-cases/GetNotificationUseCase.js';
import type { MarkAsReadUseCase } from '../../application/use-cases/MarkAsReadUseCase.js';
import type { MarkAsUnreadUseCase } from '../../application/use-cases/MarkAsUnreadUseCase.js';
import type { MarkManyAsReadUseCase } from '../../application/use-cases/MarkManyAsReadUseCase.js';
import type { GetUnreadCountUseCase } from '../../application/use-cases/GetUnreadCountUseCase.js';
import type { NotificationContext, NotificationFilters, NotificationPaginationOptions } from '../../domain/index.js';

interface AuthenticatedRequest extends Request {
  user?: { sub: string; type: 'user' | 'candidate'; tenantId?: string; roles?: string[] };
}

function buildContext(req: AuthenticatedRequest): NotificationContext {
  return {
    actorId: req.user!.sub,
    actorType: req.user!.type,
    tenantId: req.user!.tenantId ?? req.user!.sub,
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    channel: (req.get('x-channel') || 'api') as 'web' | 'mobile' | 'api',
  };
}

export class NotificationController {
  constructor(
    private readonly listUC: ListNotificationsUseCase,
    private readonly getUC: GetNotificationUseCase,
    private readonly markReadUC: MarkAsReadUseCase,
    private readonly markUnreadUC: MarkAsUnreadUseCase,
    private readonly markManyReadUC: MarkManyAsReadUseCase,
    private readonly unreadCountUC: GetUnreadCountUseCase,
  ) {}

  listNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' }); return; }
    const ctx = buildContext(req);
    const filters: NotificationFilters = {
      status: req.query.status as NotificationFilters['status'],
      type: req.query.type as NotificationFilters['type'],
      priority: req.query.priority as NotificationFilters['priority'],
      since: req.query.since ? new Date(req.query.since as string) : undefined,
    };
    const pagination: NotificationPaginationOptions = {
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      cursor: req.query.cursor as string | undefined,
    };
    const result = await this.listUC.execute(ctx, filters, pagination);
    if (!result.success) { res.status(500).json({ error: result.error, code: result.errorCode }); return; }
    res.status(200).json(result.data);
  };

  getNotification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' }); return; }
    const ctx = buildContext(req);
    const result = await this.getUC.execute(ctx, req.params.id);
    if (!result.success) {
      res.status(result.errorCode === 'NOTIFICATION_NOT_FOUND' ? 404 : 500).json({ error: result.error, code: result.errorCode }); return;
    }
    res.status(200).json(result.data);
  };

  markAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' }); return; }
    const ctx = buildContext(req);
    const result = await this.markReadUC.execute(ctx, req.params.id);
    if (!result.success) {
      res.status(result.errorCode === 'NOTIFICATION_NOT_FOUND' ? 404 : 500).json({ error: result.error, code: result.errorCode }); return;
    }
    res.status(200).json(result.data);
  };

  markAsUnread = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' }); return; }
    const ctx = buildContext(req);
    const result = await this.markUnreadUC.execute(ctx, req.params.id);
    if (!result.success) {
      res.status(result.errorCode === 'NOTIFICATION_NOT_FOUND' ? 404 : 500).json({ error: result.error, code: result.errorCode }); return;
    }
    res.status(200).json(result.data);
  };

  markManyAsRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' }); return; }
    const ctx = buildContext(req);
    const result = await this.markManyReadUC.execute(ctx, req.body.ids);
    if (!result.success) { res.status(500).json({ error: result.error, code: result.errorCode }); return; }
    res.status(200).json(result.data);
  };

  getUnreadCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' }); return; }
    const ctx = buildContext(req);
    const result = await this.unreadCountUC.execute(ctx);
    if (!result.success) { res.status(500).json({ error: result.error, code: result.errorCode }); return; }
    res.status(200).json(result.data);
  };
}
