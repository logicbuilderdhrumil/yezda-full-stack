/**
 * UI Kit controller.
 */
import type { Request, Response } from 'express';
import type {
  GetAvailableThemes,
  GetAvailableCategories,
  GetUIConfig,
  GetThemedVariants,
  GetUIKitHealth,
} from '../../application/index.js';

export class UIKitController {
  constructor(
    private getThemesUC: GetAvailableThemes,
    private getCategoriesUC: GetAvailableCategories,
    private getUIConfigUC: GetUIConfig,
    private getThemedVariantsUC: GetThemedVariants,
    private getHealthUC: GetUIKitHealth,
  ) {}

  getAvailableThemes = async (_req: Request, res: Response) => {
    const themes = await this.getThemesUC.execute();
    res.json({ success: true, data: themes });
  };

  getAvailableCategories = async (_req: Request, res: Response) => {
    const categories = await this.getCategoriesUC.execute();
    res.json({ success: true, data: categories });
  };

  getUIConfig = async (req: Request, res: Response) => {
    const config = await this.getUIConfigUC.execute(req.query as any);
    res.json({ success: true, data: config });
  };

  getThemedVariants = async (req: Request, res: Response) => {
    const variants = await this.getThemedVariantsUC.execute(req.query as any);
    res.json({ success: true, data: variants });
  };

  getUIKitHealth = async (_req: Request, res: Response) => {
    const health = await this.getHealthUC.execute();
    res.json({ success: true, data: health });
  };
}
