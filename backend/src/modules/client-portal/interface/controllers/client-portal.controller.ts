/**
 * Client Portal Controller
 * Interface adapter translating HTTP requests to use-case calls.
 */
import type { Request, Response } from 'express';
import type {
  GetDashboardUseCase,
  ListCandidatesUseCase,
  GetCandidateDetailUseCase,
  GetOrgSettingsUseCase,
  UpdateOrgSettingsUseCase,
  ListScreeningsUseCase,
  GetReportUseCase,
} from '../../application/index.js';
import type { RequestContext } from '../../domain/index.js';

export class ClientPortalController {
  constructor(
    private readonly getDashboardUC: GetDashboardUseCase,
    private readonly listCandidatesUC: ListCandidatesUseCase,
    private readonly getCandidateDetailUC: GetCandidateDetailUseCase,
    private readonly getOrgSettingsUC: GetOrgSettingsUseCase,
    private readonly updateOrgSettingsUC: UpdateOrgSettingsUseCase,
    private readonly listScreeningsUC: ListScreeningsUseCase,
    private readonly getReportUC: GetReportUseCase,
  ) {}

  private buildCtx(req: Request): RequestContext {
    const user = (req as Record<string, unknown>).user as Record<string, unknown> | undefined;
    return {
      userId: (user?.id as string) ?? 'anonymous',
      userType: (user?.userType as 'user' | 'candidate') ?? 'user',
      tenantId: (user?.tenantId as string) ?? (req as Record<string, unknown>).tenantScope as string ?? (req.get('x-tenant-id') as string) ?? '',
      ipAddress: req.ip,
      channel: 'web',
    };
  }

  getDashboard = async (req: Request, res: Response): Promise<void> => {
    const ctx = this.buildCtx(req);
    const result = this.getDashboardUC.execute(ctx);
    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.code });
      return;
    }
    res.status(200).json(result.data);
  };

  listCandidates = async (req: Request, res: Response): Promise<void> => {
    const ctx = this.buildCtx(req);
    const params = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      search: req.query.search as string | undefined,
      status: req.query.status as string | undefined,
    };
    const result = this.listCandidatesUC.execute(ctx, params);
    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.code });
      return;
    }
    res.status(200).json(result.data);
  };

  getCandidateDetail = async (req: Request, res: Response): Promise<void> => {
    const ctx = this.buildCtx(req);
    const result = this.getCandidateDetailUC.execute(ctx, req.params.id);
    if (!result.success) {
      const status = result.code === 'NOT_FOUND' ? 404 : 500;
      res.status(status).json({ error: result.error, code: result.code });
      return;
    }
    res.status(200).json(result.data);
  };

  getOrgSettings = async (req: Request, res: Response): Promise<void> => {
    const ctx = this.buildCtx(req);
    const result = this.getOrgSettingsUC.execute(ctx);
    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.code });
      return;
    }
    res.status(200).json(result.data);
  };

  updateOrgSettings = async (req: Request, res: Response): Promise<void> => {
    const ctx = this.buildCtx(req);
    const result = this.updateOrgSettingsUC.execute(ctx, req.body);
    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.code });
      return;
    }
    res.status(200).json(result.data);
  };

  listScreenings = async (req: Request, res: Response): Promise<void> => {
    const ctx = this.buildCtx(req);
    const params = {
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      status: req.query.status as string | undefined,
      type: req.query.type as string | undefined,
      candidateId: req.query.candidateId as string | undefined,
    };
    const result = this.listScreeningsUC.execute(ctx, params);
    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.code });
      return;
    }
    res.status(200).json(result.data);
  };

  getReport = async (req: Request, res: Response): Promise<void> => {
    const ctx = this.buildCtx(req);
    const result = this.getReportUC.execute(ctx);
    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.code });
      return;
    }
    res.status(200).json(result.data);
  };
}
