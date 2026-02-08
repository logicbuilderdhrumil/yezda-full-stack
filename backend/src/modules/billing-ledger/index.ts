/**
 * Billing Ledger Module — Composition Root
 */
import type { Router } from 'express';
import { PostgresBillingLedgerRepository } from './infrastructure/repositories/PostgresBillingLedgerRepository.js';
import { GetBilledEntriesUseCase } from './application/use-cases/GetBilledEntriesUseCase.js';
import { GetUnbilledEntriesUseCase } from './application/use-cases/GetUnbilledEntriesUseCase.js';
import { CreateEntryUseCase } from './application/use-cases/CreateEntryUseCase.js';
import { UpdateEntryUseCase } from './application/use-cases/UpdateEntryUseCase.js';
import { FinalizeEntryUseCase } from './application/use-cases/FinalizeEntryUseCase.js';
import { GetHealthUseCase, GetMetricsUseCase } from './application/use-cases/GetHealthUseCase.js';
import { BillingLedgerController } from './interface/controllers/billing-ledger.controller.js';
import { createBillingLedgerRoutes } from './interface/routes/billing-ledger.routes.js';
import { auditService } from '../../services/audit.service.js';
import { billingLedgerMetricsService } from '../../services/billing-ledger-metrics.service.js';
import { AuditServiceAdapter } from './infrastructure/adapters/AuditServiceAdapter.js';
import { MetricsServiceAdapter } from './infrastructure/adapters/MetricsServiceAdapter.js';

export interface BillingLedgerModule {
  routes: Router;
}

export function createBillingLedgerModule(): BillingLedgerModule {
  const repo = new PostgresBillingLedgerRepository();
  const audit = new AuditServiceAdapter(auditService);
  const metrics = new MetricsServiceAdapter(billingLedgerMetricsService);

  const getBilledEntries = new GetBilledEntriesUseCase(repo, audit, metrics);
  const getUnbilledEntries = new GetUnbilledEntriesUseCase(repo, audit, metrics);
  const createEntry = new CreateEntryUseCase(repo, audit, metrics);
  const updateEntry = new UpdateEntryUseCase(repo, audit, metrics);
  const finalizeEntry = new FinalizeEntryUseCase(repo, audit, metrics);
  const getHealth = new GetHealthUseCase(metrics);
  const getMetrics = new GetMetricsUseCase(metrics);

  const controller = new BillingLedgerController(
    getBilledEntries,
    getUnbilledEntries,
    createEntry,
    updateEntry,
    finalizeEntry,
    getHealth,
    getMetrics,
  );

  const routes = createBillingLedgerRoutes(controller);
  return { routes };
}
