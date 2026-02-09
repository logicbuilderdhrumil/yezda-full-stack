import type { Request, Response } from 'express';
import type { GetShellConfigUseCase, GetRoutePoliciesUseCase, GetNavigationUseCase, GetPreferenceDefaultsUseCase, GetUserPreferencesUseCase, UpdateUserPreferencesUseCase } from '../../application/use-cases/shell-use-cases.js';

interface AuthReq extends Request { user?: { sub: string; roles?: string[] } }

export class ShellController {
  constructor(
    private readonly getConfig: GetShellConfigUseCase,
    private readonly getPolicies: GetRoutePoliciesUseCase,
    private readonly getNav: GetNavigationUseCase,
    private readonly getPrefDefaults: GetPreferenceDefaultsUseCase,
    private readonly getUserPrefs: GetUserPreferencesUseCase,
    private readonly updatePrefs: UpdateUserPreferencesUseCase,
  ) {}
  getShellConfig = (_req: Request, res: Response) => { res.json(this.getConfig.execute()); };
  getRoutePolicies = (_req: Request, res: Response) => { res.json(this.getPolicies.execute()); };
  getPreferenceDefaults = (_req: Request, res: Response) => { res.json(this.getPrefDefaults.execute()); };
  getNavigation = (req: AuthReq, res: Response) => { if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; } res.json(this.getNav.execute(req.user.sub, req.user.roles ?? [])); };
  getPreferences = (req: AuthReq, res: Response) => { if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; } res.json(this.getUserPrefs.execute(req.user.sub)); };
  updatePreferences = (req: AuthReq, res: Response) => { if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; } res.json(this.updatePrefs.execute(req.user.sub, req.body)); };
}
