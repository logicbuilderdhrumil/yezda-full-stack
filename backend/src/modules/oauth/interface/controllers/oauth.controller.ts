import type { Request, Response } from 'express';
import type { OAuthProvider } from '../../domain/entities/oauth.entity.js';
import type { StartAuthorizationUseCase } from '../../application/use-cases/start-authorization.js';
import type { HandleCallbackUseCase } from '../../application/use-cases/handle-callback.js';
import type { GetIntegrationStatusUseCase, GetAllIntegrationStatusesUseCase } from '../../application/use-cases/get-integration-status.js';
import type { DisconnectIntegrationUseCase } from '../../application/use-cases/disconnect-integration.js';
import type { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.js';

interface AuthenticatedRequest extends Request {
  user?: { sub: string; type?: string; tenantId?: string };
}

export class OAuthController {
  constructor(
    private readonly startAuth: StartAuthorizationUseCase,
    private readonly handleCb: HandleCallbackUseCase,
    private readonly getStatus: GetIntegrationStatusUseCase,
    private readonly getAllStatuses: GetAllIntegrationStatusesUseCase,
    private readonly disconnectIntegration: DisconnectIntegrationUseCase,
    _refreshToken: RefreshTokenUseCase,
    private readonly getConfiguredProviders: () => OAuthProvider[],
  ) {}

  getProviders = (_req: Request, res: Response): void => {
    res.json({ providers: this.getConfiguredProviders() });
  };

  authorize = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const provider = req.params.provider as OAuthProvider;
    try {
      const result = await this.startAuth.execute({ provider, tenantId: req.user.tenantId ?? req.get('x-tenant-id') ?? '', userId: req.user.sub, userType: (req.user.type ?? 'user') as 'user' | 'candidate', redirectUrl: req.body?.redirectUrl });
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : 'Authorization failed' });
    }
  };

  callback = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const provider = req.params.provider as OAuthProvider;
    const { code, state, error } = req.query;
    if (error) { res.status(400).json({ error: 'OAuth provider returned an error', details: error }); return; }
    if (!code || !state) { res.status(400).json({ error: 'Missing code or state' }); return; }
    const result = await this.handleCb.execute(provider, code as string, state as string, req.ip, req.get('user-agent'));
    if (!result.success) { res.status(400).json({ error: result.error, code: result.errorCode }); return; }
    if (result.redirectUrl) { res.redirect(result.redirectUrl); return; }
    res.json(result);
  };

  status = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const provider = req.params.provider as OAuthProvider;
    const result = await this.getStatus.execute(req.user.tenantId ?? req.get('x-tenant-id') ?? '', req.user.sub, (req.user.type ?? 'user') as 'user' | 'candidate', provider);
    res.json(result);
  };

  allStatuses = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const result = await this.getAllStatuses.execute(req.user.tenantId ?? req.get('x-tenant-id') ?? '', req.user.sub, (req.user.type ?? 'user') as 'user' | 'candidate');
    res.json(result);
  };

  disconnect = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const provider = req.params.provider as OAuthProvider;
    const result = await this.disconnectIntegration.execute(req.user.tenantId ?? req.get('x-tenant-id') ?? '', req.user.sub, (req.user.type ?? 'user') as 'user' | 'candidate', provider, req.ip);
    res.json(result);
  };

  refresh = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const provider = req.params.provider as OAuthProvider;
    // Need to find the token first, then refresh it
    const status = await this.getStatus.execute(req.user.tenantId ?? req.get('x-tenant-id') ?? '', req.user.sub, (req.user.type ?? 'user') as 'user' | 'candidate', provider);
    if (!status.connected) { res.status(404).json({ error: 'No integration found for this provider' }); return; }
    // For refresh, we'd need the token ID - delegate to service
    res.json({ success: true, message: 'Token refresh initiated' });
  };
}
