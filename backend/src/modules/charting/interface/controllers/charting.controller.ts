import type { Request, Response } from 'express';
import type { GetAvailableMetrics, QueryChartData, AggregateMetric, GetChartingHealth } from '../../application/index.js';

export class ChartingController {
  constructor(
    private getMetricsUC: GetAvailableMetrics,
    private queryDataUC: QueryChartData,
    private aggregateUC: AggregateMetric,
    private getHealthUC: GetChartingHealth,
  ) {}

  getAvailableMetrics = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    res.json({ success: true, data: await this.getMetricsUC.execute(tenantId) });
  };

  queryChartData = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    res.json({ success: true, data: await this.queryDataUC.execute(tenantId, req.body) });
  };

  aggregateMetric = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    res.json({ success: true, data: await this.aggregateUC.execute(tenantId, req.body) });
  };

  getChartingHealth = async (_req: Request, res: Response) => {
    res.json({ success: true, data: await this.getHealthUC.execute() });
  };
}
