import type { Router } from 'express';
import { InMemoryMockRepository } from './infrastructure/repositories/InMemoryMockRepository.js';
import { GetMockStatusUseCase, GetMockFixtureUseCase, ListFixturesUseCase } from './application/use-cases/mock-use-cases.js';
import { MockController } from './interface/controllers/mock.controller.js';
import { createMockRoutes } from './interface/routes/mock.routes.js';
export interface MockModule { router: Router; }
export function createMockModule(): MockModule {
  const repo = new InMemoryMockRepository();
  return { router: createMockRoutes(new MockController(new GetMockStatusUseCase(repo), new GetMockFixtureUseCase(repo), new ListFixturesUseCase(repo))) };
}
