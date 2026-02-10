import type { Router } from 'express';
import { InMemoryDashboardRepository } from './infrastructure/index.js';
import { GetDashboardSummaryUseCase, GetActivityFeedUseCase, GetTrendsUseCase, GetKpiSummaryUseCase } from './application/index.js';
import { DashboardController, createDashboardRoutes } from './interface/index.js';
import type { IAuditService } from './domain/ports/IAuditService.js';
import type { IMetricsService } from './domain/ports/IMetricsService.js';
import type { RequestContext } from './domain/entities/dashboard.entity.js';
import { auditService } from '../../services/audit.service.js';
import { metricsService } from '../../services/metrics.service.js';
import type { AuditEventType } from '../../models/audit.model.js';

/** Adapter that bridges IAuditService port to the real auditService */
const auditAdapter: IAuditService = {
  log(event: string, context: RequestContext, details?: Record<string, unknown>): void {
    auditService.log({
      eventType: event as AuditEventType,
      actorId: context.userId,
      actorType: context.userType,
      channel: context.channel ?? 'api',
      ipAddress: context.ipAddress,
      metadata: { tenantId: context.tenantId, ...details },
      success: true,
    });
  },
};

export interface HomeDashboardModule { router: Router; }

export function createHomeDashboardModule(): HomeDashboardModule {
  const repo = new InMemoryDashboardRepository();
  const metrics = metricsService as unknown as IMetricsService;

  const getSummaryUC = new GetDashboardSummaryUseCase(repo, auditAdapter, metrics);
  const getActivityUC = new GetActivityFeedUseCase(repo, auditAdapter, metrics);
  const getTrendsUC = new GetTrendsUseCase(repo, auditAdapter, metrics);
  const getKpiUC = new GetKpiSummaryUseCase(repo, metrics);

  const controller = new DashboardController(getSummaryUC, getActivityUC, getTrendsUC, getKpiUC);
  const router = createDashboardRoutes(controller);
  return { router };
}
