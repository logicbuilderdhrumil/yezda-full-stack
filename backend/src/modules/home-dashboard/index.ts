import type { Router } from 'express';
import { InMemoryDashboardRepository } from './infrastructure/index.js';
import { GetDashboardSummaryUseCase, GetActivityFeedUseCase, GetTrendsUseCase, GetKpiSummaryUseCase } from './application/index.js';
import { DashboardController, createDashboardRoutes } from './interface/index.js';
import type { IAuditService } from './domain/ports/IAuditService.js';
import type { IMetricsService } from './domain/ports/IMetricsService.js';
import { auditService } from '../../services/audit.service.js';
import { metricsService } from '../../services/metrics.service.js';

export interface HomeDashboardModule { router: Router; }

export function createHomeDashboardModule(): HomeDashboardModule {
  const repo = new InMemoryDashboardRepository();
  const audit = auditService as unknown as IAuditService;
  const metrics = metricsService as unknown as IMetricsService;

  const getSummaryUC = new GetDashboardSummaryUseCase(repo, audit, metrics);
  const getActivityUC = new GetActivityFeedUseCase(repo, audit, metrics);
  const getTrendsUC = new GetTrendsUseCase(repo, audit, metrics);
  const getKpiUC = new GetKpiSummaryUseCase(repo, metrics);

  const controller = new DashboardController(getSummaryUC, getActivityUC, getTrendsUC, getKpiUC);
  const router = createDashboardRoutes(controller);
  return { router };
}
