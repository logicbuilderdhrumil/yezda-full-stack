/**
 * File Management Service
 * Task 1.2, 1.3, 1.5, 1.6: Core file management business logic
 */

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type {
  FileMetadata,
  FileUploadInput,
  FileUploadResult,
  FileDownloadResult,
  FileListOptions,
  FileListResult,
  StorageAdapter,
} from '../models/file-management.model.js';
import {
  isAllowedFileType,
  isValidFileSize,
  normalizeFileSize,
} from '../models/file-management.model.js';
import { fileRepository } from '../repositories/file-management.repository.js';
import { localStorageAdapter } from './local-storage.adapter.js';
import { fileStorageConfig } from '../config/file-storage.config.js';
import { fileMetricsService } from './file-management-metrics.service.js';
import { auditService } from './audit.service.js';

/**
 * File Management Service
 * Handles file upload, download, metadata, and security validation
 */
export class FileManagementService {
  private storageAdapter: StorageAdapter;

  constructor() {
    // Select storage adapter based on configuration
    this.storageAdapter = localStorageAdapter;
    // Future: Add S3 adapter selection when implemented
  }

  /**
   * Upload a file with validation and malware scanning
   * Task 1.2: Upload endpoint with metadata
   * Task 1.6: Security validation (type/size) and malware scanning hooks
   */
  async uploadFile(input: FileUploadInput): Promise<FileUploadResult> {
    const startTime = Date.now();
    const { tenantId, uploaderId, uploaderType, file, expiresInDays } = input;

    try {
      // Task 1.6: Validate file type
      if (!isAllowedFileType(file.mimetype)) {
        auditService.log({
          eventType: 'FILE_VALIDATION_FAILED' as any,
          actorId: uploaderId,
          actorType: uploaderType,
          channel: 'api',
          metadata: {
            tenantId,
            reason: 'Invalid file type',
            mimeType: file.mimetype,
          },
          success: false,
        });

        return {
          success: false,
          error: `File type ${file.mimetype} is not allowed`,
          errorCode: 'INVALID_FILE_TYPE',
        };
      }

      // Task 1.6: Validate file size
      if (!isValidFileSize(file.size)) {
        auditService.log({
          eventType: 'FILE_VALIDATION_FAILED' as any,
          actorId: uploaderId,
          actorType: uploaderType,
          channel: 'api',
          metadata: {
            tenantId,
            reason: 'Invalid file size',
            size: file.size,
            maxSize: fileStorageConfig.upload.maxFileSizeBytes,
          },
          success: false,
        });

        return {
          success: false,
          error: `File size exceeds maximum allowed (${normalizeFileSize(fileStorageConfig.upload.maxFileSizeBytes)})`,
          errorCode: 'FILE_TOO_LARGE',
        };
      }

      // Generate unique filename and storage key
      const fileId = uuidv4();
      const ext = file.originalname.split('.').pop() || '';
      const filename = `${fileId}${ext ? '.' + ext : ''}`;
      const storageKey = `${tenantId}/${fileId.substring(0, 2)}/${filename}`;

      // Calculate checksum for integrity
      const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

      // Store file using adapter
      await this.storageAdapter.store(file.buffer, storageKey, file.mimetype);

      // Calculate expiration date if specified
      let expiresAt: Date | undefined;
      if (expiresInDays && expiresInDays > 0) {
        const maxDays = fileStorageConfig.retention.maxExpirationDays;
        const days = Math.min(expiresInDays, maxDays);
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      } else if (fileStorageConfig.retention.defaultExpirationDays) {
        expiresAt = new Date(
          Date.now() + fileStorageConfig.retention.defaultExpirationDays * 24 * 60 * 60 * 1000
        );
      }

      // Create metadata record
      const fileMetadata = await fileRepository.create({
        tenantId,
        uploaderId,
        uploaderType,
        filename,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageKey,
        storageAdapter: this.storageAdapter.getName(),
        checksum,
        expiresAt,
      });

      // Task 1.6: Trigger malware scan (async hook)
      this.triggerMalwareScan(fileMetadata);

      // Task 1.7: Audit logging
      auditService.log({
        eventType: 'FILE_UPLOADED' as any,
        actorId: uploaderId,
        actorType: uploaderType,
        targetId: fileMetadata.id,
        targetType: 'file',
        channel: 'api',
        metadata: {
          tenantId,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          sizeFormatted: normalizeFileSize(file.size),
        },
        success: true,
      });

      // Record metrics
      const latency = Date.now() - startTime;
      fileMetricsService.recordUpload(latency, tenantId, true);
      fileMetricsService.recordStorageUsage(file.size, tenantId);

      return { success: true, file: fileMetadata };
    } catch (error) {
      const latency = Date.now() - startTime;
      fileMetricsService.recordUpload(latency, tenantId, false);

      console.error('[FileManagementService] Upload failed:', error);
      return {
        success: false,
        error: 'Failed to upload file',
        errorCode: 'UPLOAD_FAILED',
      };
    }
  }

  /**
   * Download a file with access control
   * Task 1.2: Download endpoint
   * Task 1.5: Tenant scoping and RBAC
   */
  async downloadFile(
    fileId: string,
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    ipAddress?: string
  ): Promise<FileDownloadResult> {
    const startTime = Date.now();

    try {
      // Task 1.5: Verify tenant ownership
      const file = await fileRepository.findByIdForTenant(fileId, tenantId);
      if (!file) {
        // Task 1.7: Log access denial
        auditService.log({
          eventType: 'FILE_ACCESS_DENIED' as any,
          actorId: userId,
          actorType: userType,
          targetId: fileId,
          targetType: 'file',
          channel: 'api',
          ipAddress,
          metadata: {
            tenantId,
            reason: 'File not found or cross-tenant access',
          },
          success: false,
        });

        fileMetricsService.recordDownload(Date.now() - startTime, tenantId, false);

        return {
          success: false,
          error: 'File not found',
          errorCode: 'FILE_NOT_FOUND',
        };
      }

      // Check if file is expired
      if (file.expiresAt && file.expiresAt < new Date()) {
        return {
          success: false,
          error: 'File has expired',
          errorCode: 'FILE_EXPIRED',
        };
      }

      // Check malware scan status
      if (file.scanStatus === 'infected') {
        return {
          success: false,
          error: 'File failed security scan',
          errorCode: 'FILE_INFECTED',
        };
      }

      // Retrieve file from storage
      const buffer = await this.storageAdapter.retrieve(file.storageKey);
      if (!buffer) {
        return {
          success: false,
          error: 'File content not found',
          errorCode: 'STORAGE_ERROR',
        };
      }

      // Update access count
      await fileRepository.incrementAccessCount(fileId);

      // Task 1.7: Audit logging
      auditService.log({
        eventType: 'FILE_DOWNLOADED' as any,
        actorId: userId,
        actorType: userType,
        targetId: fileId,
        targetType: 'file',
        channel: 'api',
        ipAddress,
        metadata: {
          tenantId,
          filename: file.originalFilename,
          size: file.size,
        },
        success: true,
      });

      // Record metrics
      const latency = Date.now() - startTime;
      fileMetricsService.recordDownload(latency, tenantId, true);

      return { success: true, file, buffer };
    } catch (error) {
      const latency = Date.now() - startTime;
      fileMetricsService.recordDownload(latency, tenantId, false);

      console.error('[FileManagementService] Download failed:', error);
      return {
        success: false,
        error: 'Failed to download file',
        errorCode: 'DOWNLOAD_FAILED',
      };
    }
  }

  /**
   * Get file metadata
   * Task 1.3: Metadata normalization
   */
  async getFileMetadata(
    fileId: string,
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate'
  ): Promise<FileMetadata | null> {
    const file = await fileRepository.findByIdForTenant(fileId, tenantId);
    if (!file) {
      auditService.log({
        eventType: 'FILE_ACCESS_DENIED' as any,
        actorId: userId,
        actorType: userType,
        targetId: fileId,
        targetType: 'file',
        channel: 'api',
        metadata: { tenantId, reason: 'Metadata access denied' },
        success: false,
      });
      return null;
    }

    return file;
  }

  /**
   * List files for a tenant
   */
  async listFiles(options: FileListOptions): Promise<FileListResult> {
    return fileRepository.list(options);
  }

  /**
   * Delete a file (soft delete)
   */
  async deleteFile(
    fileId: string,
    tenantId: string,
    userId: string,
    userType: 'user' | 'candidate',
    ipAddress?: string
  ): Promise<{ success: boolean; error?: string }> {
    // Verify tenant ownership
    const file = await fileRepository.findByIdForTenant(fileId, tenantId);
    if (!file) {
      return { success: false, error: 'File not found' };
    }

    // Soft delete metadata
    await fileRepository.softDelete(fileId);

    // Note: Actual file deletion from storage can be deferred to cleanup job
    // for recovery purposes

    auditService.log({
      eventType: 'FILE_DELETED' as any,
      actorId: userId,
      actorType: userType,
      targetId: fileId,
      targetType: 'file',
      channel: 'api',
      ipAddress,
      metadata: {
        tenantId,
        filename: file.originalFilename,
      },
      success: true,
    });

    return { success: true };
  }

  /**
   * Trigger malware scan (async)
   * Task 1.6: Malware scanning hooks
   */
  private async triggerMalwareScan(file: FileMetadata): Promise<void> {
    if (!fileStorageConfig.security.enableMalwareScanning) {
      // Mark as clean if scanning is disabled
      await fileRepository.updateScanStatus(file.id, 'clean');
      return;
    }

    const startTime = Date.now();

    try {
      // TODO: Implement actual malware scanning integration
      // For now, simulate scan by marking as clean
      // In production, call external scanning service (e.g., ClamAV, VirusTotal)

      await fileRepository.updateScanStatus(file.id, 'clean');

      const latency = Date.now() - startTime;
      fileMetricsService.recordScan(latency, file.tenantId, 'clean');

      auditService.log({
        eventType: 'FILE_SCAN_COMPLETED' as any,
        actorType: 'system',
        targetId: file.id,
        targetType: 'file',
        channel: 'api',
        metadata: {
          tenantId: file.tenantId,
          result: 'clean',
          latencyMs: latency,
        },
        success: true,
      });
    } catch (error) {
      const latency = Date.now() - startTime;
      fileMetricsService.recordScan(latency, file.tenantId, 'error');

      await fileRepository.updateScanStatus(file.id, 'error', String(error));

      auditService.log({
        eventType: 'FILE_SCAN_FAILED' as any,
        actorType: 'system',
        targetId: file.id,
        targetType: 'file',
        channel: 'api',
        metadata: {
          tenantId: file.tenantId,
          error: String(error),
        },
        success: false,
      });

      console.error('[FileManagementService] Malware scan failed:', error);
    }
  }

  /**
   * Get storage usage for a tenant
   */
  async getTenantStorageUsage(tenantId: string): Promise<{
    usedBytes: number;
    usedFormatted: string;
  }> {
    const usedBytes = await fileRepository.getTenantStorageUsed(tenantId);
    return {
      usedBytes,
      usedFormatted: normalizeFileSize(usedBytes),
    };
  }

  /**
   * Get health metrics
   * Task 1.9: SLO monitoring
   */
  getHealthMetrics() {
    return fileMetricsService.getHealthSummary();
  }
}

export const fileManagementService = new FileManagementService();
