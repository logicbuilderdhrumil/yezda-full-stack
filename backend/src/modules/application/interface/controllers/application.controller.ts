import type { Request, Response } from 'express';
import type { ListApplications, GetApplication, GetApplicationDraft, SaveApplicationDraft, SubmitApplication } from '../../application/index.js';

export class ApplicationController {
  constructor(
    private listUC: ListApplications,
    private getUC: GetApplication,
    private getDraftUC: GetApplicationDraft,
    private saveDraftUC: SaveApplicationDraft,
    private submitUC: SubmitApplication,
  ) {}

  list = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const userId = (req as any).user?.id ?? '';
    res.json({ success: true, data: await this.listUC.execute(tenantId, userId) });
  };

  get = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const app = await this.getUC.execute(tenantId, req.params.applicationId);
    if (!app) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    res.json({ success: true, data: app });
  };

  getDraft = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const draft = await this.getDraftUC.execute(tenantId, req.params.applicationId);
    res.json({ success: true, data: draft });
  };

  saveDraft = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const app = await this.saveDraftUC.execute(tenantId, req.params.applicationId, req.body);
    if (!app) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    res.json({ success: true, data: app });
  };

  submit = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const app = await this.submitUC.execute(tenantId, req.params.applicationId);
    if (!app) { res.status(404).json({ success: false, error: 'Not found' }); return; }
    res.json({ success: true, data: app });
  };
}
