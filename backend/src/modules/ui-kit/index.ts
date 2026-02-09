/**
 * UI Kit module composition root.
 */
import { InMemoryUIKitRepository } from './infrastructure/index.js';
import {
  GetAvailableThemes,
  GetAvailableCategories,
  GetUIConfig,
  GetThemedVariants,
  GetUIKitHealth,
} from './application/index.js';
import { UIKitController, createUIKitRoutes } from './interface/index.js';

export function createUIKitModule() {
  const repo = new InMemoryUIKitRepository();

  const getThemesUC = new GetAvailableThemes(repo);
  const getCategoriesUC = new GetAvailableCategories(repo);
  const getUIConfigUC = new GetUIConfig(repo);
  const getThemedVariantsUC = new GetThemedVariants(repo);
  const getHealthUC = new GetUIKitHealth(repo);

  const controller = new UIKitController(
    getThemesUC,
    getCategoriesUC,
    getUIConfigUC,
    getThemedVariantsUC,
    getHealthUC,
  );

  return { router: createUIKitRoutes(controller) };
}
