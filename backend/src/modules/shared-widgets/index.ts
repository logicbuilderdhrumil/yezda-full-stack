import { InMemorySharedWidgetsRepository } from './infrastructure/index.js';
import { GetAvailableWidgets, GetTableData, GetVisualizationData, GetWidgetsHealth } from './application/index.js';
import { SharedWidgetsController, createSharedWidgetsRoutes } from './interface/index.js';

export function createSharedWidgetsModule() {
  const repo = new InMemorySharedWidgetsRepository();
  const controller = new SharedWidgetsController(
    new GetAvailableWidgets(repo),
    new GetTableData(repo),
    new GetVisualizationData(repo),
    new GetWidgetsHealth(repo),
  );
  return { router: createSharedWidgetsRoutes(controller) };
}
