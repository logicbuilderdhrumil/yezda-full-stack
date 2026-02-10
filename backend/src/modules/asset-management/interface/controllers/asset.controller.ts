/**
 * Asset Management Controller
 * Interface adapter translating HTTP requests to use-case calls.
 */
import type { Request, Response } from 'express';
import type {
  QueryAssetsUseCase,
  GetAssetsByTypeUseCase,
  GetAssetByIdUseCase,
  GetTemplatesByTypeUseCase,
  GetTemplateByIdUseCase,
  GetHealthSummaryUseCase,
} from '../../application/index.js';
import type { AssetType, AssetUsage, TemplateType, RequestContext } from '../../domain/index.js';

export class AssetController {
  constructor(
    private readonly queryAssetsUC: QueryAssetsUseCase,
    private readonly getAssetsByTypeUC: GetAssetsByTypeUseCase,
    private readonly getAssetByIdUC: GetAssetByIdUseCase,
    private readonly getTemplatesByTypeUC: GetTemplatesByTypeUseCase,
    private readonly getTemplateByIdUC: GetTemplateByIdUseCase,
    private readonly getHealthSummaryUC: GetHealthSummaryUseCase,
  ) {}

  private buildCtx(req: Request): RequestContext {
    const user = (req as unknown as Record<string, unknown>).user as Record<string, unknown> | undefined;
    return {
      userId: (user?.id as string) ?? 'anonymous',
      userType: (user?.userType as 'user' | 'candidate') ?? 'user',
      tenantId: (user?.tenantId as string) ?? (req.get('x-tenant-id') as string) ?? '',
      ipAddress: req.ip,
      channel: 'web',
    };
  }

  queryAssets = async (req: Request, res: Response): Promise<void> => {
    const ctx = this.buildCtx(req);
    const filters = {
      type: req.query.type as AssetType | undefined,
      usage: req.query.usage as AssetUsage | undefined,
      tags: req.query.tags ? String(req.query.tags).split(',') : undefined,
      search: req.query.search as string | undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    };
    const result = await this.queryAssetsUC.execute(ctx, filters);
    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.code });
      return;
    }
    res.json({ data: result.data });
  };

  getAssetsByType = async (req: Request, res: Response): Promise<void> => {
    const ctx = this.buildCtx(req);
    const type = req.params.type as AssetType;
    const result = await this.getAssetsByTypeUC.execute(ctx, type);
    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.code });
      return;
    }
    res.json({ data: result.data });
  };

  getAssetById = async (req: Request, res: Response): Promise<void> => {
    const ctx = this.buildCtx(req);
    const result = await this.getAssetByIdUC.execute(ctx, req.params.assetId);
    if (!result.success) {
      const status = result.code === 'ASSET_NOT_FOUND' ? 404 : 500;
      res.status(status).json({ error: result.error, code: result.code });
      return;
    }
    res.json({ data: result.data });
  };

  getTemplatesByType = async (req: Request, res: Response): Promise<void> => {
    const ctx = this.buildCtx(req);
    const templateType = req.params.templateType as TemplateType;
    const result = await this.getTemplatesByTypeUC.execute(ctx, templateType);
    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.code });
      return;
    }
    res.json({ data: result.data });
  };

  getTemplateById = async (req: Request, res: Response): Promise<void> => {
    const ctx = this.buildCtx(req);
    const result = await this.getTemplateByIdUC.execute(ctx, req.params.templateId);
    if (!result.success) {
      const status = result.code === 'TEMPLATE_NOT_FOUND' ? 404 : 500;
      res.status(status).json({ error: result.error, code: result.code });
      return;
    }
    res.json({ data: result.data });
  };

  getHealthSummary = async (req: Request, res: Response): Promise<void> => {
    const ctx = this.buildCtx(req);
    const result = await this.getHealthSummaryUC.execute(ctx);
    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.code });
      return;
    }
    res.json({ data: result.data });
  };
}
