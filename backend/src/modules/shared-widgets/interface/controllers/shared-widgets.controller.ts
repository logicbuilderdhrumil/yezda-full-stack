import type { Request, Response } from 'express';
import type { GetAvailableWidgets, GetTableData, GetVisualizationData, GetWidgetsHealth } from '../../application/index.js';

interface AuthenticatedRequest extends Request {
  user?: { sub: string; id: string; type: string; tenantId?: string };
}

function requireTenantId(req: AuthenticatedRequest): string {
  const tenantId = req.user?.tenantId || req.get('x-tenant-id');
  if (!tenantId) throw Object.assign(new Error('Tenant ID is required'), { status: 400 });
  return tenantId;
}

export class SharedWidgetsController {
  constructor(
    private readonly getWidgetsUC: GetAvailableWidgets,
    private readonly getTableDataUC: GetTableData,
    private readonly getVisDataUC: GetVisualizationData,
    private readonly getHealthUC: GetWidgetsHealth,
  ) {}

  getAvailableWidgets = async (_req: Request, res: Response) => {
    res.json({ success: true, data: await this.getWidgetsUC.execute() });
  };

  getTableData = async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = requireTenantId(req);
    res.json({ success: true, data: await this.getTableDataUC.execute(tenantId, req.params.widgetId, req.query as any) });
  };

  getVisualizationData = async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = requireTenantId(req);
    res.json({ success: true, data: await this.getVisDataUC.execute(tenantId, req.params.widgetId, req.query as any) });
  };

  getWidgetsHealth = async (_req: Request, res: Response) => {
    res.json({ success: true, data: await this.getHealthUC.execute() });
  };
}
