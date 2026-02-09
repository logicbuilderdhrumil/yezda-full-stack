import type { Request, Response } from 'express';
import type { RequestExport, GetExportStatus, DownloadExport } from '../../application/index.js';

export class ExportController {
  constructor(
    private requestExportUC: RequestExport,
    private getExportStatusUC: GetExportStatus,
    private downloadExportUC: DownloadExport,
  ) {}

  requestExport = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const userId = (req as any).user?.id ?? '';
    const exp = await this.requestExportUC.execute({ tenantId, userId, ...req.body });
    res.status(201).json({ success: true, data: exp });
  };

  getExportStatus = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const exp = await this.getExportStatusUC.execute(tenantId, req.params.exportId);
    if (!exp) {
      res.status(404).json({ success: false, error: 'Export not found' });
      return;
    }
    res.json({ success: true, data: exp });
  };

  downloadExport = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const url = await this.downloadExportUC.execute(tenantId, req.params.exportId);
    if (!url) {
      res.status(404).json({ success: false, error: 'Export not available' });
      return;
    }
    res.json({ success: true, data: { downloadUrl: url } });
  };
}
