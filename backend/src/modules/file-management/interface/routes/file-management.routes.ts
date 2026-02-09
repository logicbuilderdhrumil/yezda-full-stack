/**
 * File Management Routes (Clean Architecture)
 * Route definitions accepting controller as parameter.
 */
import { Router } from 'express';
import multer from 'multer';
import type { FileManagementController } from '../controllers/file-management.controller.js';
import { requireAuth } from '../../../../shared/infrastructure/middleware/index.js';
import {
  fileUploadRateLimiter,
  fileDownloadRateLimiter,
  fileMetadataRateLimiter,
} from '../../../../middleware/file-management-rate-limit.middleware.js';
import { fileStorageConfig } from '../../../../config/file-storage.config.js';

export function createFileManagementRoutes(controller: FileManagementController): Router {
  const router = Router();

  // Configure multer for memory storage with size limits
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: fileStorageConfig.upload.maxFileSizeBytes,
    },
  });

  // Upload file
  router.post(
    '/upload',
    requireAuth,
    fileUploadRateLimiter,
    upload.single('file'),
    controller.uploadFile,
  );

  // List files
  router.get(
    '/',
    requireAuth,
    fileMetadataRateLimiter,
    controller.listFiles,
  );

  // Get storage usage
  router.get(
    '/storage-usage',
    requireAuth,
    fileMetadataRateLimiter,
    controller.getStorageUsage,
  );

  // Get health metrics
  router.get(
    '/health',
    requireAuth,
    controller.getHealth,
  );

  // Get file metadata
  router.get(
    '/:id',
    requireAuth,
    fileMetadataRateLimiter,
    controller.getFile,
  );

  // Download file
  router.get(
    '/:id/download',
    requireAuth,
    fileDownloadRateLimiter,
    controller.downloadFile,
  );

  // Delete file
  router.delete(
    '/:id',
    requireAuth,
    fileMetadataRateLimiter,
    controller.deleteFile,
  );

  return router;
}
