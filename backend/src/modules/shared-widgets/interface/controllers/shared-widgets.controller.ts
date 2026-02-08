import type { Request, Response } from 'express';
import type { GetAvailableWidgets, GetTableData, GetVisualizationData, GetWidgetsHealth } from '../../application/index.js';

export class SharedWidgetsController {
  constructor(
    private getWidgetsUC: GetAvailableWidgets,
    private getTableDataUC: GetTableData,
    private getVisDataUC: GetVisualizationData,
    private getHealthUC: GetWidgetsHealth,
  ) {}

  getAvailableWidgets = async (_req: Request, res: Response) => {
    res.json({ success: true, data: await this.getWidgetsUC.execute() });
  };

  getTableData = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id') ?? null;
    res.json({ success: true, data: await this.getTableDataUC.execute(tenantId, req.params.widgetId, req.query as any) });
  };

  getVisualizationData = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id') ?? null;
    res.json({ success: true, data: await this.getVisDataUC.execute(tenantId, req.params.widgetId, req.query as any) });
  };

  getWidgetsHealth = async (_req: Request, res: Response) => {
    res.json({ success: true, data: await this.getHealthUC.execute() });
  };
}
