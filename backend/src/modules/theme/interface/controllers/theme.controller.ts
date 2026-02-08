import type { Request, Response } from 'express';
import type { GetPresetsUseCase, GetPreferenceUseCase, UpdatePreferenceUseCase } from '../../application/index.js';
import type { RequestContext } from '../../domain/index.js';

export class ThemeController {
  constructor(private readonly getPresetsUC: GetPresetsUseCase, private readonly getPrefUC: GetPreferenceUseCase, private readonly updatePrefUC: UpdatePreferenceUseCase) {}

  private buildCtx(req: Request): RequestContext {
    const user = (req as unknown as Record<string, unknown>).user as Record<string, unknown> | undefined;
    return { userId: (user?.id as string) ?? 'anonymous', userType: (user?.userType as 'user' | 'candidate') ?? 'user', tenantId: (user?.tenantId as string) ?? (req.get('x-tenant-id') as string) ?? '', ipAddress: req.ip, channel: 'web' };
  }

  getPresets = async (req: Request, res: Response): Promise<void> => {
    const result = await this.getPresetsUC.execute(this.buildCtx(req));
    if (!result.success) { res.status(500).json({ error: result.error, code: result.code }); return; }
    res.json({ data: result.data });
  };

  getPreference = async (req: Request, res: Response): Promise<void> => {
    const result = await this.getPrefUC.execute(this.buildCtx(req));
    if (!result.success) { res.status(500).json({ error: result.error, code: result.code }); return; }
    res.json({ data: result.data });
  };

  updatePreference = async (req: Request, res: Response): Promise<void> => {
    const result = await this.updatePrefUC.execute(this.buildCtx(req), req.body);
    if (!result.success) { res.status(500).json({ error: result.error, code: result.code }); return; }
    res.json({ data: result.data });
  };
}
