import type { Router } from 'express';
import { LegacyStateStoreRepository } from './infrastructure/repositories/LegacyStateStoreRepository.js';
import { GetPreferencesUseCase, UpdatePreferencesUseCase, UpdateSinglePreferenceUseCase, GetSessionStateUseCase, UpdateSessionStateUseCase, GetUserStateUseCase, ClearUserStateUseCase } from './application/use-cases/state-store-use-cases.js';
import { StateStoreController } from './interface/controllers/state-store.controller.js';
import { createStateStoreRoutes } from './interface/routes/state-store.routes.js';
import { auditService } from '../../services/audit.service.js';
import { encrypt, decrypt } from '../../services/crypto.service.js';

export interface StateStoreModule {
  router: Router;
}

export function createStateStoreModule(): StateStoreModule {
  const repo = new LegacyStateStoreRepository();
  const audit = { log: (e: Parameters<typeof auditService.log>[0]) => auditService.log(e) };
  const crypto = { encrypt, decrypt };

  const getPrefs = new GetPreferencesUseCase(repo, crypto, audit);
  const updatePrefs = new UpdatePreferencesUseCase(repo, crypto, audit);
  const updateSinglePref = new UpdateSinglePreferenceUseCase(updatePrefs);
  const getSession = new GetSessionStateUseCase(repo, crypto, audit);
  const updateSession = new UpdateSessionStateUseCase(repo, crypto, audit);
  const getUserState = new GetUserStateUseCase(getPrefs, getSession);
  const clearState = new ClearUserStateUseCase(repo, audit);

  const controller = new StateStoreController(getPrefs, updatePrefs, updateSinglePref, getSession, updateSession, getUserState, clearState);
  const router = createStateStoreRoutes(controller);

  return { router };
}
