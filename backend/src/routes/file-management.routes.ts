/**
 * File Management Routes
 * Task 1.2: File upload/download endpoints with middleware
 */

import { Router } from 'express';
import multer from 'multer';
import * as fileController from '../controllers/file-management.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  fileUploadRateLimiter,
  fileDownloadRateLimiter,
  fileMetadataRateLimiter,
} from '../middleware/file-management-rate-limit.middleware.js';
import { fileStorageConfig } from '../config/file-storage.config.js';

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
  fileController.uploadFile
);

// List files
router.get(
  '/',
  requireAuth,
  fileMetadataRateLimiter,
  fileController.listFiles
);

// Get storage usage
router.get(
  '/storage-usage',
  requireAuth,
  fileMetadataRateLimiter,
  fileController.getStorageUsage
);

// Get health metrics
router.get(
  '/health',
  requireAuth,
  fileController.getHealth
);

// Get file metadata
router.get(
  '/:id',
  requireAuth,
  fileMetadataRateLimiter,
  fileController.getFile
);

// Download file
router.get(
  '/:id/download',
  requireAuth,
  fileDownloadRateLimiter,
  fileController.downloadFile
);

// Delete file
router.delete(
  '/:id',
  requireAuth,
  fileMetadataRateLimiter,
  fileController.deleteFile
);

export default router;
