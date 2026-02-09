import type { Router } from 'express';
import { InMemoryFirebaseRepository } from './infrastructure/repositories/InMemoryFirebaseRepository.js';
import { RegisterTokenUseCase, UnregisterTokenUseCase, GetUserTokensUseCase, DispatchNotificationUseCase } from './application/use-cases/firebase-use-cases.js';
import { FirebaseController } from './interface/controllers/firebase.controller.js';
import { createFirebaseRoutes } from './interface/routes/firebase.routes.js';
export interface FirebaseModule { router: Router; }
export function createFirebaseModule(): FirebaseModule {
  const repo = new InMemoryFirebaseRepository();
  const ctrl = new FirebaseController(new RegisterTokenUseCase(repo), new UnregisterTokenUseCase(repo), new GetUserTokensUseCase(repo), new DispatchNotificationUseCase(repo));
  return { router: createFirebaseRoutes(ctrl) };
}
