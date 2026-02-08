import type { Request, Response } from 'express';
import type { ThemeMode } from '../../domain/entities/custom-components.entity.js';
import type { ListOrganizationsUseCase, SetActiveOrganizationUseCase, GetThemePreferenceUseCase, UpdateThemePreferenceUseCase } from '../../application/use-cases/custom-components-use-cases.js';

interface AuthenticatedRequest extends Request {
  user?: { sub: string; type?: string };
}

const VALID_THEME_MODES: ThemeMode[] = ['light', 'dark', 'system'];

function getContext(req: Request) {
  return { ipAddress: req.ip || req.socket.remoteAddress, userAgent: req.get('user-agent'), channel: (req.get('x-channel') || 'api') as 'web' | 'mobile' | 'api' };
}

export class CustomComponentsController {
  constructor(
    private readonly listOrgs: ListOrganizationsUseCase,
    private readonly setActiveOrg: SetActiveOrganizationUseCase,
    private readonly getTheme: GetThemePreferenceUseCase,
    private readonly updateTheme: UpdateThemePreferenceUseCase,
  ) {}

  listOrganizations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const result = await this.listOrgs.execute({ userId: req.user.sub, userType: (req.user.type ?? 'user') as 'user' | 'candidate' }, getContext(req));
    if (!result.success) { res.status(500).json({ error: result.error, code: result.errorCode }); return; }
    res.json(result.data);
  };

  setActiveOrganization = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const { organizationId } = req.body;
    if (!organizationId || typeof organizationId !== 'string') { res.status(400).json({ error: 'organizationId is required' }); return; }
    const result = await this.setActiveOrg.execute(organizationId, { userId: req.user.sub, userType: (req.user.type ?? 'user') as 'user' | 'candidate' }, getContext(req));
    if (!result.success) { res.status(result.errorCode === 'COMPONENT_ORG_NOT_MEMBER' ? 403 : 500).json({ error: result.error, code: result.errorCode }); return; }
    res.json(result.data);
  };

  getThemePreference = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const result = await this.getTheme.execute({ userId: req.user.sub, userType: (req.user.type ?? 'user') as 'user' | 'candidate' }, getContext(req));
    if (!result.success) { res.status(500).json({ error: result.error, code: result.errorCode }); return; }
    res.json(result.data);
  };

  updateThemePreference = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const { mode } = req.body;
    if (!mode || !VALID_THEME_MODES.includes(mode)) { res.status(400).json({ error: `mode must be one of: ${VALID_THEME_MODES.join(', ')}` }); return; }
    const result = await this.updateTheme.execute(mode, { userId: req.user.sub, userType: (req.user.type ?? 'user') as 'user' | 'candidate' }, getContext(req));
    if (!result.success) { res.status(500).json({ error: result.error, code: result.errorCode }); return; }
    res.json(result.data);
  };
}
