import type { Request, Response } from 'express';
import type { GetDashboardSummaryUseCase, GetActivityFeedUseCase, GetTrendsUseCase, GetKpiSummaryUseCase } from '../../application/index.js';
import type { RequestContext, KpiMetricType, ActivityType, DashboardTimeRange } from '../../domain/index.js';

export class DashboardController {
  constructor(
    private readonly getSummaryUC: GetDashboardSummaryUseCase,
    private readonly getActivityUC: GetActivityFeedUseCase,
    private readonly getTrendsUC: GetTrendsUseCase,
    private readonly getKpiUC: GetKpiSummaryUseCase,
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

  getSummary = async (req: Request, res: Response): Promise<void> => {
    const ctx = this.buildCtx(req);
    const timeRange = (req.query.timeRange as DashboardTimeRange) ?? '7d';
    const metricsStr = req.query.metrics as string | undefined;
    const requestedMetrics = metricsStr ? metricsStr.split(',') as KpiMetricType[] : undefined;
    const activityLimit = req.query.activityLimit ? Number(req.query.activityLimit) : 10;
    const result = await this.getSummaryUC.execute(ctx, timeRange, requestedMetrics, activityLimit);
    if (!result.success) { res.status(500).json({ error: result.error, code: result.code }); return; }
    res.json(result.data);
  };

  getActivity = async (req: Request, res: Response): Promise<void> => {
    const ctx = this.buildCtx(req);
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const cursor = req.query.cursor as string | undefined;
    const typesStr = req.query.types as string | undefined;
    const types = typesStr ? typesStr.split(',') as ActivityType[] : undefined;
    const result = await this.getActivityUC.execute(ctx, limit, cursor, types);
    if (!result.success) { res.status(500).json({ error: result.error, code: result.code }); return; }
    res.json(result.data);
  };

  getTrends = async (req: Request, res: Response): Promise<void> => {
    const ctx = this.buildCtx(req);
    const timeRange = (req.query.timeRange as DashboardTimeRange) ?? '7d';
    const metricsStr = req.query.metrics as string | undefined;
    const metrics = metricsStr ? metricsStr.split(',') as KpiMetricType[] : ['active_users', 'new_signups'] as KpiMetricType[];
    const aggregation = (req.query.aggregation as 'hourly' | 'daily' | 'weekly') ?? 'daily';
    const result = await this.getTrendsUC.execute(ctx, timeRange, metrics, aggregation);
    if (!result.success) { res.status(500).json({ error: result.error, code: result.code }); return; }
    res.json(result.data);
  };

  getKpis = async (req: Request, res: Response): Promise<void> => {
    const ctx = this.buildCtx(req);
    const timeRange = (req.query.timeRange as DashboardTimeRange) ?? '7d';
    const metricsStr = req.query.metrics as string | undefined;
    const requestedMetrics = metricsStr ? metricsStr.split(',') as KpiMetricType[] : undefined;
    const result = await this.getKpiUC.execute(ctx, timeRange, requestedMetrics);
    if (!result.success) { res.status(500).json({ error: result.error, code: result.code }); return; }
    res.json(result.data);
  };
}
