import { InMemoryApplicationRepository } from './infrastructure/index.js';
import { ListApplications, GetApplication, GetApplicationDraft, SaveApplicationDraft, SubmitApplication } from './application/index.js';
import { ApplicationController, createApplicationRoutes } from './interface/index.js';

export function createApplicationModule() {
  const repo = new InMemoryApplicationRepository();
  const controller = new ApplicationController(
    new ListApplications(repo),
    new GetApplication(repo),
    new GetApplicationDraft(repo),
    new SaveApplicationDraft(repo),
    new SubmitApplication(repo),
  );
  return { router: createApplicationRoutes(controller) };
}
