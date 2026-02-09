import type { Request, Response } from 'express';
import type { GetAvailableMetrics, QueryChartData, AggregateMetric, GetChartingHealth } from '../../application/index.js';

interface AuthenticatedRequest extends Request {
  user?: { sub: string; tenantId?: string; roles?: string[] };
}

function getTenantId(req: AuthenticatedRequest): string {
  const tenantId = req.user?.tenantId || req.get('x-tenant-id');
  if (!tenantId) {
    throw Object.assign(new Error('Tenant ID is required'), { status: 400 });
  }
  return tenantId;
}

export class ChartingController {
  constructor(
    private getMetricsUC: GetAvailableMetrics,
    private queryDataUC: QueryChartData,
    private aggregateUC: AggregateMetric,
    private getHealthUC: GetChartingHealth,
  ) {}

  getAvailableMetrics = async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = getTenantId(req);
    res.json({ success: true, data: await this.getMetricsUC.execute(tenantId) });
  };

  queryChartData = async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = getTenantId(req);
    res.json({ success: true, data: await this.queryDataUC.execute(tenantId, req.body) });
  };

  aggregateMetric = async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = getTenantId(req);
    res.json({ success: true, data: await this.aggregateUC.execute(tenantId, req.body) });
  };

  getChartingHealth = async (_req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, data: await this.getHealthUC.execute() });
  };
}
