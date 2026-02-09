/**
 * File Management Module — Composition Root
 * Wires domain ports to infrastructure implementations and exposes routes.
 */
import type { Router } from 'express';
import { PostgresFileRepository } from './infrastructure/repositories/PostgresFileRepository.js';
import { LocalStorageAdapter } from './infrastructure/storage/LocalStorageAdapter.js';
import { FileMetricsService } from './infrastructure/services/FileMetricsService.js';
import { UploadFileUseCase } from './application/use-cases/UploadFileUseCase.js';
import { DownloadFileUseCase } from './application/use-cases/DownloadFileUseCase.js';
import { GetFileMetadataUseCase } from './application/use-cases/GetFileMetadataUseCase.js';
import { ListFilesUseCase } from './application/use-cases/ListFilesUseCase.js';
import { DeleteFileUseCase } from './application/use-cases/DeleteFileUseCase.js';
import { GetStorageUsageUseCase } from './application/use-cases/GetStorageUsageUseCase.js';
import { GetHealthMetricsUseCase } from './application/use-cases/GetHealthMetricsUseCase.js';
import { FileManagementController } from './interface/controllers/file-management.controller.js';
import { createFileManagementRoutes } from './interface/routes/file-management.routes.js';
import { auditService } from '../../services/audit.service.js';
import { fileStorageConfig } from '../../config/file-storage.config.js';
import type { IAuditService } from './domain/ports/IAuditService.js';

export interface FileManagementModule {
  routes: Router;
}

export function createFileManagementModule(): FileManagementModule {
  // Infrastructure
  const fileRepo = new PostgresFileRepository();
  const storageAdapter = new LocalStorageAdapter(fileStorageConfig.local.basePath);
  const metricsService = new FileMetricsService();
  const audit = auditService as unknown as IAuditService;

  // Use cases
  const uploadFile = new UploadFileUseCase(fileRepo, storageAdapter, audit, metricsService, fileStorageConfig);
  const downloadFile = new DownloadFileUseCase(fileRepo, storageAdapter, audit, metricsService);
  const getFileMetadata = new GetFileMetadataUseCase(fileRepo, audit);
  const listFiles = new ListFilesUseCase(fileRepo);
  const deleteFile = new DeleteFileUseCase(fileRepo, audit);
  const getStorageUsage = new GetStorageUsageUseCase(fileRepo);
  const getHealthMetrics = new GetHealthMetricsUseCase(metricsService);

  // Controller
  const controller = new FileManagementController(
    uploadFile,
    downloadFile,
    getFileMetadata,
    listFiles,
    deleteFile,
    getStorageUsage,
    getHealthMetrics,
  );

  // Routes
  const routes = createFileManagementRoutes(controller);

  return { routes };
}
