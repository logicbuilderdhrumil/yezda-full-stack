/**
 * Asset Management Module — Composition Root
 * Wires domain, application, infrastructure, and interface layers.
 */
import type { Router } from 'express';
import { PostgresAssetRepository } from './infrastructure/index.js';
import {
  QueryAssetsUseCase,
  GetAssetsByTypeUseCase,
  GetAssetByIdUseCase,
  GetTemplatesByTypeUseCase,
  GetTemplateByIdUseCase,
  GetHealthSummaryUseCase,
} from './application/index.js';
import { AssetController, createAssetRoutes } from './interface/index.js';
import type { IAuditService } from './domain/ports/IAuditService.js';
import type { IMetricsService } from './domain/ports/IMetricsService.js';
import type { RequestContext } from './domain/entities/asset.entity.js';
import { auditService } from '../../services/audit.service.js';
import { metricsService } from '../../services/metrics.service.js';
import type { AuditEventType } from '../../models/audit.model.js';

export interface AssetManagementModule {
  router: Router;
}

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

export function createAssetManagementModule(): AssetManagementModule {
  // Infrastructure
  const assetRepo = new PostgresAssetRepository();

  // Adapt shared services to domain ports
  const metrics = metricsService as unknown as IMetricsService;

  // Use cases
  const queryAssetsUC = new QueryAssetsUseCase(assetRepo, auditAdapter, metrics);
  const getAssetsByTypeUC = new GetAssetsByTypeUseCase(assetRepo, auditAdapter, metrics);
  const getAssetByIdUC = new GetAssetByIdUseCase(assetRepo, auditAdapter, metrics);
  const getTemplatesByTypeUC = new GetTemplatesByTypeUseCase(assetRepo, auditAdapter, metrics);
  const getTemplateByIdUC = new GetTemplateByIdUseCase(assetRepo, auditAdapter, metrics);
  const getHealthSummaryUC = new GetHealthSummaryUseCase(assetRepo, metrics);

  // Controller
  const controller = new AssetController(
    queryAssetsUC,
    getAssetsByTypeUC,
    getAssetByIdUC,
    getTemplatesByTypeUC,
    getTemplateByIdUC,
    getHealthSummaryUC,
  );

  // Routes
  const router = createAssetRoutes(controller);

  return { router };
}
