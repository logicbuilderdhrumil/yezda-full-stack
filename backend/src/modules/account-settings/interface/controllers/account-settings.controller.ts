/**
 * Account Settings controller.
 */
import type { Request, Response } from 'express';
import type {
  GetProfile,
  UpdateProfile,
  GetIntegrations,
  GetIntegration,
  VerifyIntegration,
  DisconnectIntegration,
  GetHealthSummary,
} from '../../application/index.js';

export class AccountSettingsController {
  constructor(
    private getProfileUC: GetProfile,
    private updateProfileUC: UpdateProfile,
    private getIntegrationsUC: GetIntegrations,
    private getIntegrationUC: GetIntegration,
    private verifyIntegrationUC: VerifyIntegration,
    private disconnectIntegrationUC: DisconnectIntegration,
    private getHealthUC: GetHealthSummary,
  ) {}

  getProfile = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const userId = (req as any).user?.id ?? '';
    const profile = await this.getProfileUC.execute(tenantId, userId);
    if (!profile) {
      res.status(404).json({ success: false, error: 'Profile not found' });
      return;
    }
    res.json({ success: true, data: profile });
  };

  updateProfile = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const userId = (req as any).user?.id ?? '';
    const profile = await this.updateProfileUC.execute(tenantId, userId, req.body);
    res.json({ success: true, data: profile });
  };

  getIntegrations = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const userId = (req as any).user?.id ?? '';
    const integrations = await this.getIntegrationsUC.execute(tenantId, userId);
    res.json({ success: true, data: integrations });
  };

  getIntegration = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const userId = (req as any).user?.id ?? '';
    const integration = await this.getIntegrationUC.execute(tenantId, userId, req.params.provider as any);
    if (!integration) {
      res.status(404).json({ success: false, error: 'Integration not found' });
      return;
    }
    res.json({ success: true, data: integration });
  };

  verifyIntegration = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const userId = (req as any).user?.id ?? '';
    const integration = await this.verifyIntegrationUC.execute(tenantId, userId, req.params.provider as any, req.body);
    res.json({ success: true, data: integration });
  };

  disconnectIntegration = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      return res.status(400).json({ success: false, error: 'Tenant ID is required' });
    }
    const userId = (req as any).user?.id ?? '';
    const result = await this.disconnectIntegrationUC.execute(tenantId, userId, req.params.provider as any);
    if (!result) {
      res.status(404).json({ success: false, error: 'Integration not found' });
      return;
    }
    res.json({ success: true, message: 'Disconnected' });
  };

  getHealthSummary = async (_req: Request, res: Response) => {
    const health = await this.getHealthUC.execute();
    res.json({ success: true, data: health });
  };
}
