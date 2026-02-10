import type { Request, Response } from 'express';
import type { GetConversationTypes, GetFileCategories, GetChatSummaries, GetFileTypeMetadata, GetViewComponentsHealth } from '../../application/index.js';

export class ViewComponentsController {
  constructor(
    private getConvTypesUC: GetConversationTypes,
    private getFileCatsUC: GetFileCategories,
    private getChatSumsUC: GetChatSummaries,
    private getFileTypeUC: GetFileTypeMetadata,
    private getHealthUC: GetViewComponentsHealth,
  ) {}

  getConversationTypes = async (_req: Request, res: Response) => {
    res.json({ success: true, data: await this.getConvTypesUC.execute() });
  };

  getFileCategories = async (_req: Request, res: Response) => {
    res.json({ success: true, data: await this.getFileCatsUC.execute() });
  };

  getChatSummaries = async (req: Request, res: Response) => {
    const tenantId = (req as any).user?.tenantId ?? req.get('x-tenant-id');
    if (!tenantId) {
      res.status(400).json({ success: false, error: 'Tenant ID is required' });
      return;
    }
    res.json({ success: true, data: await this.getChatSumsUC.execute(tenantId, req.query as any) });
  };

  getFileTypeMetadata = async (req: Request, res: Response) => {
    res.json({ success: true, data: await this.getFileTypeUC.execute(req.query as any) });
  };

  getHealth = async (_req: Request, res: Response) => {
    res.json({ success: true, data: await this.getHealthUC.execute() });
  };
}
