import { InMemoryConsentRepository } from './infrastructure/index.js';
import { GetConsentPrompt, GetConsentStatus, GetConsentById, SubmitConsent, UpdateConsent } from './application/index.js';
import { ConsentController, createConsentRoutes } from './interface/index.js';

export function createConsentModule() {
  const repo = new InMemoryConsentRepository();
  const controller = new ConsentController(
    new GetConsentPrompt(repo),
    new GetConsentStatus(repo),
    new GetConsentById(repo),
    new SubmitConsent(repo),
    new UpdateConsent(repo),
  );
  return { router: createConsentRoutes(controller) };
}
