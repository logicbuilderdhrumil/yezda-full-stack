import type { TemplateLayoutNavigation, GlobalControlSummary, LayoutAccessContext } from '../entities/template-layout.entity.js';
export interface ITemplateLayoutRepository {
  getNavigation(context: LayoutAccessContext): Promise<TemplateLayoutNavigation>;
  getGlobalControls(context: LayoutAccessContext): Promise<GlobalControlSummary>;
}
