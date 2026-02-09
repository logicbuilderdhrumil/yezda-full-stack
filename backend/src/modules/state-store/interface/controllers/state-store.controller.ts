import type { Request, Response } from 'express';
import type { PreferenceKey } from '../../domain/entities/state-store.entity.js';
import type { GetPreferencesUseCase, UpdatePreferencesUseCase, UpdateSinglePreferenceUseCase, GetSessionStateUseCase, UpdateSessionStateUseCase, GetUserStateUseCase, ClearUserStateUseCase } from '../../application/use-cases/state-store-use-cases.js';

interface AuthenticatedRequest extends Request {
  user?: { sub: string; type?: string; tenantId?: string };
}

function getRequestContext(req: Request) {
  return { ipAddress: req.ip || req.socket.remoteAddress, channel: (req.get('x-channel') || 'api') as 'web' | 'mobile' | 'api' };
}

export class StateStoreController {
  constructor(
    private readonly getPrefs: GetPreferencesUseCase,
    private readonly updatePrefs: UpdatePreferencesUseCase,
    private readonly updateSinglePref: UpdateSinglePreferenceUseCase,
    private readonly getSession: GetSessionStateUseCase,
    private readonly updateSession: UpdateSessionStateUseCase,
    private readonly getUserState: GetUserStateUseCase,
    private readonly clearState: ClearUserStateUseCase,
  ) {}

  getPreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const result = await this.getPrefs.execute(req.user.tenantId ?? req.get('x-tenant-id') ?? '', req.user.sub, (req.user.type ?? 'user') as 'user' | 'candidate', getRequestContext(req));
    if (!result.success) { res.status(500).json({ error: result.error, code: result.errorCode }); return; }
    res.json(result.data);
  };

  updatePreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const result = await this.updatePrefs.execute(req.user.tenantId ?? req.get('x-tenant-id') ?? '', req.user.sub, (req.user.type ?? 'user') as 'user' | 'candidate', req.body, getRequestContext(req));
    if (!result.success) { res.status(400).json({ error: result.error, code: result.errorCode }); return; }
    res.json(result.data);
  };

  updatePreference = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const key = req.params.key as PreferenceKey;
    const { value } = req.body;
    if (!value) { res.status(400).json({ error: 'value is required' }); return; }
    const result = await this.updateSinglePref.execute(req.user.tenantId ?? req.get('x-tenant-id') ?? '', req.user.sub, (req.user.type ?? 'user') as 'user' | 'candidate', key, value, getRequestContext(req));
    if (!result.success) { res.status(400).json({ error: result.error, code: result.errorCode }); return; }
    res.json(result.data);
  };

  getSessionState = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const result = await this.getSession.execute(req.user.tenantId ?? req.get('x-tenant-id') ?? '', req.user.sub, (req.user.type ?? 'user') as 'user' | 'candidate', getRequestContext(req));
    if (!result.success) { res.status(500).json({ error: result.error, code: result.errorCode }); return; }
    res.json(result.data);
  };

  updateSessionState = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const result = await this.updateSession.execute(req.user.tenantId ?? req.get('x-tenant-id') ?? '', req.user.sub, (req.user.type ?? 'user') as 'user' | 'candidate', req.body, getRequestContext(req));
    if (!result.success) { res.status(500).json({ error: result.error, code: result.errorCode }); return; }
    res.json(result.data);
  };

  getAllState = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const result = await this.getUserState.execute(req.user.tenantId ?? req.get('x-tenant-id') ?? '', req.user.sub, (req.user.type ?? 'user') as 'user' | 'candidate', getRequestContext(req));
    if (!result.success) { res.status(500).json({ error: result.error, code: result.errorCode }); return; }
    res.json(result.data);
  };

  clearAllState = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const result = await this.clearState.execute(req.user.tenantId ?? req.get('x-tenant-id') ?? '', req.user.sub, (req.user.type ?? 'user') as 'user' | 'candidate', getRequestContext(req));
    if (!result.success) { res.status(500).json({ error: result.error, code: result.errorCode }); return; }
    res.json(result.data);
  };
}
