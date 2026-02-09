import type { Request, Response } from 'express';
import type { GetLocalePreferenceUseCase, UpdateLocalePreferenceUseCase, GetTranslationsUseCase, GetSupportedLocalesUseCase } from '../../application/index.js';
import type { RequestContext, SupportedLocale, TranslationNamespace } from '../../domain/index.js';

export class LocalizationController {
  constructor(
    private readonly getPrefUC: GetLocalePreferenceUseCase,
    private readonly updatePrefUC: UpdateLocalePreferenceUseCase,
    private readonly getTransUC: GetTranslationsUseCase,
    private readonly getLocalesUC: GetSupportedLocalesUseCase,
  ) {}

  private buildCtx(req: Request): RequestContext {
    const user = (req as unknown as Record<string, unknown>).user as Record<string, unknown> | undefined;
    return { userId: (user?.id as string) ?? 'anonymous', userType: (user?.userType as 'user' | 'candidate') ?? 'user', tenantId: (user?.tenantId as string) ?? (req.get('x-tenant-id') as string) ?? '', ipAddress: req.ip, channel: 'web' };
  }

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

  getTranslations = async (req: Request, res: Response): Promise<void> => {
    const locale = (req.query.locale as SupportedLocale) ?? 'en';
    const nsStr = req.query.namespaces as string | undefined;
    const namespaces = nsStr ? nsStr.split(',') as TranslationNamespace[] : undefined;
    const result = await this.getTransUC.execute(this.buildCtx(req), locale, namespaces);
    if (!result.success) { res.status(500).json({ error: result.error, code: result.code }); return; }
    res.json(result.data);
  };

  getSupportedLocales = async (req: Request, res: Response): Promise<void> => {
    const result = await this.getLocalesUC.execute(this.buildCtx(req));
    if (!result.success) { res.status(500).json({ error: result.error, code: result.code }); return; }
    res.json({ data: result.data });
  };
}
