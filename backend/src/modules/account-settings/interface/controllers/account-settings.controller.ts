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

interface AuthenticatedRequest extends Request {
  user?: { id: string; tenantId?: string; roles?: string[] };
}

function getTenantId(req: AuthenticatedRequest): string {
  const tenantId = req.user?.tenantId || req.get('x-tenant-id');
  if (!tenantId) {
    throw Object.assign(new Error('Tenant ID is required'), { status: 400 });
  }
  return tenantId;
}

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

  getProfile = async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = getTenantId(req);
    const userId = req.user?.id ?? '';
    const profile = await this.getProfileUC.execute(tenantId, userId);
    if (!profile) {
      res.status(404).json({ success: false, error: 'Profile not found' });
      return;
    }
    res.json({ success: true, data: profile });
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = getTenantId(req);
    const userId = req.user?.id ?? '';
    const profile = await this.updateProfileUC.execute(tenantId, userId, req.body);
    res.json({ success: true, data: profile });
  };

  getIntegrations = async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = getTenantId(req);
    const userId = req.user?.id ?? '';
    const integrations = await this.getIntegrationsUC.execute(tenantId, userId);
    res.json({ success: true, data: integrations });
  };

  getIntegration = async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = getTenantId(req);
    const userId = req.user?.id ?? '';
    const integration = await this.getIntegrationUC.execute(tenantId, userId, req.params.provider as any);
    if (!integration) {
      res.status(404).json({ success: false, error: 'Integration not found' });
      return;
    }
    res.json({ success: true, data: integration });
  };

  verifyIntegration = async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = getTenantId(req);
    const userId = req.user?.id ?? '';
    const integration = await this.verifyIntegrationUC.execute(tenantId, userId, req.params.provider as any, req.body);
    res.json({ success: true, data: integration });
  };

  disconnectIntegration = async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = getTenantId(req);
    const userId = req.user?.id ?? '';
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
