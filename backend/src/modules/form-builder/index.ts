/**
 * Form Builder Module — Composition Root
 *
 * Wires all form builder dependencies using manual constructor injection.
 */
import { InMemoryFormBuilderRepository } from './infrastructure/repositories/InMemoryFormBuilderRepository.js';
import { RedisCacheAdapter } from './infrastructure/cache/RedisCacheAdapter.js';

import { CreateFormUseCase } from './application/use-cases/CreateFormUseCase.js';
import { UpdateFormUseCase } from './application/use-cases/UpdateFormUseCase.js';
import { GetFormUseCase } from './application/use-cases/GetFormUseCase.js';
import { ListFormsUseCase } from './application/use-cases/ListFormsUseCase.js';
import { DeleteFormUseCase } from './application/use-cases/DeleteFormUseCase.js';
import { CheckFormBuilderSLOsUseCase } from './application/use-cases/CheckFormBuilderSLOsUseCase.js';

import { FormBuilderController } from './interface/controllers/form-builder.controller.js';
import { createFormBuilderRoutes } from './interface/routes/form-builder.routes.js';

// Legacy service singletons (not yet migrated into this module)
import { auditService } from '../../services/audit.service.js';
import { metricsService } from '../../services/metrics.service.js';
import type { IAuditService } from './domain/ports/audit-service.port.js';

export function createFormBuilderModule() {
  // ── Infrastructure ──────────────────────────────────────────────────────
  const formRepo = new InMemoryFormBuilderRepository();
  const cacheAdapter = new RedisCacheAdapter();

  // Adapt legacy audit service to the module's port interface.
  // The port uses `string` to avoid a domain→infrastructure dependency;
  // the legacy service uses a narrower union — the cast is safe because
  // the use cases only pass known form-builder event types.
  const audit = auditService as unknown as IAuditService;

  // ── Use Cases ───────────────────────────────────────────────────────────
  const createFormUC = new CreateFormUseCase(formRepo, audit, metricsService);
  const updateFormUC = new UpdateFormUseCase(formRepo, audit, metricsService, cacheAdapter);
  const getFormUC = new GetFormUseCase(formRepo, audit, metricsService, cacheAdapter);
  const listFormsUC = new ListFormsUseCase(formRepo, metricsService, cacheAdapter);
  const deleteFormUC = new DeleteFormUseCase(formRepo, audit, metricsService, cacheAdapter);
  const checkSlosUC = new CheckFormBuilderSLOsUseCase(metricsService);

  // ── Interface ───────────────────────────────────────────────────────────
  const controller = new FormBuilderController(
    createFormUC,
    updateFormUC,
    getFormUC,
    listFormsUC,
    deleteFormUC,
    checkSlosUC,
  );

  const routes = createFormBuilderRoutes(controller);

  return {
    routes,
    controller,
    repositories: {
      form: formRepo,
    },
  };
}
