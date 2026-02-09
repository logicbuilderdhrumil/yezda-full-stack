import type { Request, Response } from 'express';
import type { RegisterTokenUseCase, UnregisterTokenUseCase, GetUserTokensUseCase, DispatchNotificationUseCase } from '../../application/use-cases/firebase-use-cases.js';

interface AuthReq extends Request { user?: { sub: string; tenantId?: string } }

export class FirebaseController {
  constructor(
    private readonly registerToken: RegisterTokenUseCase,
    private readonly unregisterToken: UnregisterTokenUseCase,
    private readonly getUserTokens: GetUserTokensUseCase,
    private readonly dispatch: DispatchNotificationUseCase,
  ) {}
  register = async (req: AuthReq, res: Response) => { if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; } await this.registerToken.execute({ id: `tok-${Date.now()}`, userId: req.user.sub, tenantId: req.user.tenantId ?? '', token: req.body.token, platform: req.body.platform, createdAt: new Date() }); res.status(201).json({ success: true }); };
  unregister = async (req: AuthReq, res: Response) => { if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; } await this.unregisterToken.execute(req.user.sub, req.body.token); res.json({ success: true }); };
  listTokens = async (req: AuthReq, res: Response) => { if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; } res.json(await this.getUserTokens.execute(req.user.sub)); };
  dispatchNotification = async (req: AuthReq, res: Response) => { if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; } const result = await this.dispatch.execute(req.body); res.json(result); };
}
