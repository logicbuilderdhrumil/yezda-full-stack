/**
 * Candidate Management Module — Composition Root
 *
 * Wires all candidate management module dependencies using manual constructor injection.
 * Imports legacy services that haven't been migrated yet.
 */
import { PostgresCandidateRepository } from './infrastructure/repositories/PostgresCandidateRepository.js';

import { ListCandidatesUseCase } from './application/use-cases/ListCandidatesUseCase.js';
import { GetCandidateByIdUseCase } from './application/use-cases/GetCandidateByIdUseCase.js';
import { CreateCandidateUseCase } from './application/use-cases/CreateCandidateUseCase.js';
import { UpdateCandidateUseCase } from './application/use-cases/UpdateCandidateUseCase.js';
import { UpdateCandidateStatusUseCase } from './application/use-cases/UpdateCandidateStatusUseCase.js';
import { BulkCreateCandidatesUseCase } from './application/use-cases/BulkCreateCandidatesUseCase.js';
import { SubmitCandidateFormUseCase } from './application/use-cases/SubmitCandidateFormUseCase.js';
import { DeleteCandidateUseCase } from './application/use-cases/DeleteCandidateUseCase.js';

import { CandidateManagementController } from './interface/controllers/candidate-management.controller.js';
import { createCandidateManagementRoutes } from './interface/routes/candidate-management.routes.js';

// Legacy service singletons (not yet migrated into this module)
import { auditService } from '../../services/audit.service.js';
import { metricsService } from '../../services/metrics.service.js';
import { globalCandidateIdentityService } from '../../services/global-candidate-identity.service.js';

export function createCandidateManagementModule() {
  // ── Infrastructure ──────────────────────────────────────────────────────
  const candidateRepo = new PostgresCandidateRepository();

  // ── Use Cases ───────────────────────────────────────────────────────────
  const listCandidatesUseCase = new ListCandidatesUseCase(candidateRepo, auditService, metricsService);
  const getCandidateByIdUseCase = new GetCandidateByIdUseCase(candidateRepo, auditService, metricsService);
  const createCandidateUseCase = new CreateCandidateUseCase(candidateRepo, auditService, metricsService, globalCandidateIdentityService);
  const updateCandidateUseCase = new UpdateCandidateUseCase(candidateRepo, auditService, metricsService);
  const updateCandidateStatusUseCase = new UpdateCandidateStatusUseCase(candidateRepo, auditService, metricsService);
  const bulkCreateCandidatesUseCase = new BulkCreateCandidatesUseCase(candidateRepo, auditService, metricsService);
  const submitCandidateFormUseCase = new SubmitCandidateFormUseCase(candidateRepo, auditService, metricsService);
  const deleteCandidateUseCase = new DeleteCandidateUseCase(candidateRepo, auditService, metricsService);

  // ── Interface ───────────────────────────────────────────────────────────
  const controller = new CandidateManagementController(
    listCandidatesUseCase,
    getCandidateByIdUseCase,
    createCandidateUseCase,
    updateCandidateUseCase,
    updateCandidateStatusUseCase,
    bulkCreateCandidatesUseCase,
    submitCandidateFormUseCase,
    deleteCandidateUseCase,
  );

  const routes = createCandidateManagementRoutes(controller);

  return {
    routes,
    controller,
    repositories: {
      candidate: candidateRepo,
    },
  };
}
