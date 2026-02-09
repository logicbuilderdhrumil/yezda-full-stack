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
import { auditService } from '../../services/audit.service.js';
import { metricsService } from '../../services/metrics.service.js';

export interface AssetManagementModule {
  router: Router;
}

export function createAssetManagementModule(): AssetManagementModule {
  // Infrastructure
  const assetRepo = new PostgresAssetRepository();

  // Adapt shared services to domain ports
  const audit = auditService as unknown as IAuditService;
  const metrics = metricsService as unknown as IMetricsService;

  // Use cases
  const queryAssetsUC = new QueryAssetsUseCase(assetRepo, audit, metrics);
  const getAssetsByTypeUC = new GetAssetsByTypeUseCase(assetRepo, audit, metrics);
  const getAssetByIdUC = new GetAssetByIdUseCase(assetRepo, audit, metrics);
  const getTemplatesByTypeUC = new GetTemplatesByTypeUseCase(assetRepo, audit, metrics);
  const getTemplateByIdUC = new GetTemplateByIdUseCase(assetRepo, audit, metrics);
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
