import type { Request, Response } from 'express';
import type { GetConsentPrompt, GetConsentStatus, GetConsentById, SubmitConsent, UpdateConsent } from '../../application/index.js';

export class ConsentController {
  constructor(
    private getPromptUC: GetConsentPrompt,
    private getStatusUC: GetConsentStatus,
    private getByIdUC: GetConsentById,
    private submitUC: SubmitConsent,
    private updateUC: UpdateConsent,
  ) {}

  getPrompt = async (req: Request, res: Response) => {
    const prompt = await this.getPromptUC.execute(req.params.applicationId);
    if (!prompt) {
      res.status(404).json({ success: false, error: 'Not found' });
      return;
    }
    res.json({ success: true, data: prompt });
  };

  getStatus = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const userId = (req as any).user?.id ?? '';
    res.json({ success: true, data: await this.getStatusUC.execute(tenantId, userId) });
  };

  getById = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const consent = await this.getByIdUC.execute(tenantId, req.params.consentId);
    if (!consent) {
      res.status(404).json({ success: false, error: 'Not found' });
      return;
    }
    res.json({ success: true, data: consent });
  };

  submit = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const userId = (req as any).user?.id ?? '';
    const consent = await this.submitUC.execute(tenantId, userId, req.body);
    res.status(201).json({ success: true, data: consent });
  };

  update = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const consent = await this.updateUC.execute(tenantId, req.params.consentId, req.body);
    if (!consent) {
      res.status(404).json({ success: false, error: 'Not found' });
      return;
    }
    res.json({ success: true, data: consent });
  };
}
