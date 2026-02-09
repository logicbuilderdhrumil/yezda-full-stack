import { InMemoryViewComponentsRepository } from './infrastructure/index.js';
import { GetConversationTypes, GetFileCategories, GetChatSummaries, GetFileTypeMetadata, GetViewComponentsHealth } from './application/index.js';
import { ViewComponentsController, createViewComponentsRoutes } from './interface/index.js';

export function createViewComponentsModule() {
  const repo = new InMemoryViewComponentsRepository();
  const controller = new ViewComponentsController(
    new GetConversationTypes(repo),
    new GetFileCategories(repo),
    new GetChatSummaries(repo),
    new GetFileTypeMetadata(repo),
    new GetViewComponentsHealth(repo),
  );
  return { router: createViewComponentsRoutes(controller) };
}
