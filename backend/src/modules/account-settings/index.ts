/**
 * Account Settings module composition root.
 */
import { InMemoryAccountSettingsRepository } from './infrastructure/index.js';
import {
  GetProfile,
  UpdateProfile,
  GetIntegrations,
  GetIntegration,
  VerifyIntegration,
  DisconnectIntegration,
  GetHealthSummary,
} from './application/index.js';
import { AccountSettingsController, createAccountSettingsRoutes } from './interface/index.js';

export function createAccountSettingsModule() {
  const repo = new InMemoryAccountSettingsRepository();

  const getProfileUC = new GetProfile(repo);
  const updateProfileUC = new UpdateProfile(repo);
  const getIntegrationsUC = new GetIntegrations(repo);
  const getIntegrationUC = new GetIntegration(repo);
  const verifyIntegrationUC = new VerifyIntegration(repo);
  const disconnectIntegrationUC = new DisconnectIntegration(repo);
  const getHealthUC = new GetHealthSummary(repo);

  const controller = new AccountSettingsController(
    getProfileUC,
    updateProfileUC,
    getIntegrationsUC,
    getIntegrationUC,
    verifyIntegrationUC,
    disconnectIntegrationUC,
    getHealthUC,
  );

  return { router: createAccountSettingsRoutes(controller) };
}
