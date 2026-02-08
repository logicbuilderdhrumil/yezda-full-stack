import type { Request, Response } from 'express';
import type { GetNavigationUseCase, GetGlobalControlsUseCase } from '../../application/index.js';
import type { RequestContext, LayoutAccessContext } from '../../domain/index.js';

export class TemplateLayoutController {
  constructor(private readonly getNavUC: GetNavigationUseCase, private readonly getControlsUC: GetGlobalControlsUseCase) {}

  private buildCtx(req: Request): RequestContext {
    const user = (req as unknown as Record<string, unknown>).user as Record<string, unknown> | undefined;
    return { userId: (user?.id as string) ?? 'anonymous', userType: (user?.userType as 'user' | 'candidate') ?? 'user', tenantId: (user?.tenantId as string) ?? (req.get('x-tenant-id') as string) ?? '', ipAddress: req.ip, channel: 'web' };
  }

  private buildAccessCtx(req: Request): LayoutAccessContext {
    const user = (req as unknown as Record<string, unknown>).user as Record<string, unknown> | undefined;
    return { userId: (user?.id as string) ?? 'anonymous', userType: (user?.userType as 'user' | 'candidate') ?? 'user', tenantId: (user?.tenantId as string) ?? '', authorities: (user?.authorities as string[]) ?? [] };
  }

  getNavigation = async (req: Request, res: Response): Promise<void> => {
    const result = await this.getNavUC.execute(this.buildCtx(req), this.buildAccessCtx(req));
    if (!result.success) { res.status(500).json({ error: result.error, code: result.code }); return; }
    res.json(result.data);
  };

  getGlobalControls = async (req: Request, res: Response): Promise<void> => {
    const result = await this.getControlsUC.execute(this.buildCtx(req), this.buildAccessCtx(req));
    if (!result.success) { res.status(500).json({ error: result.error, code: result.code }); return; }
    res.json(result.data);
  };
}
