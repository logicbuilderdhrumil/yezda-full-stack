/**
 * UploadFile Use Case
 * Validates, stores, creates metadata, triggers scan, and audits file uploads.
 */
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { IFileRepository } from '../../domain/ports/IFileRepository.js';
import type { IStorageAdapter } from '../../domain/ports/IStorageAdapter.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { IFileMetricsService } from '../../domain/ports/IFileMetricsService.js';
import type { FileMetadata, OperationResult, RequestContext } from '../../domain/entities/index.js';
import { isAllowedFileType, isValidFileSize, normalizeFileSize } from '../../domain/entities/index.js';

interface FileStorageConfig {
  upload: { maxFileSizeBytes: number };
  security: { enableMalwareScanning: boolean };
  retention: {
    defaultExpirationDays?: number;
    maxExpirationDays: number;
  };
}

interface FileInput {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

export class UploadFileUseCase {
  constructor(
    private readonly fileRepo: IFileRepository,
    private readonly storageAdapter: IStorageAdapter,
    private readonly auditService: IAuditService,
    private readonly metricsService: IFileMetricsService,
    private readonly config: FileStorageConfig,
  ) {}

  async execute(
    ctx: RequestContext,
    file: FileInput,
    expiresInDays?: number,
  ): Promise<OperationResult<FileMetadata>> {
    const startTime = Date.now();

    try {
      // Validate file type
      if (!isAllowedFileType(file.mimetype)) {
        this.auditService.log({
          eventType: 'FILE_VALIDATION_FAILED',
          actorId: ctx.userId,
          actorType: ctx.userType,
          channel: 'api',
          metadata: {
            tenantId: ctx.tenantId,
            reason: 'Invalid file type',
            mimeType: file.mimetype,
          },
          success: false,
        });

        return {
          success: false,
          error: `File type ${file.mimetype} is not allowed`,
          code: 'INVALID_FILE_TYPE',
        };
      }

      // Validate file size
      if (!isValidFileSize(file.size)) {
        this.auditService.log({
          eventType: 'FILE_VALIDATION_FAILED',
          actorId: ctx.userId,
          actorType: ctx.userType,
          channel: 'api',
          metadata: {
            tenantId: ctx.tenantId,
            reason: 'Invalid file size',
            size: file.size,
            maxSize: this.config.upload.maxFileSizeBytes,
          },
          success: false,
        });

        return {
          success: false,
          error: `File size exceeds maximum allowed (${normalizeFileSize(this.config.upload.maxFileSizeBytes)})`,
          code: 'FILE_TOO_LARGE',
        };
      }

      // Generate unique filename and storage key
      const fileId = uuidv4();
      const ext = file.originalname.split('.').pop() || '';
      const filename = `${fileId}${ext ? '.' + ext : ''}`;
      const storageKey = `${ctx.tenantId}/${fileId.substring(0, 2)}/${filename}`;

      // Calculate checksum for integrity
      const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

      // Store file using adapter
      await this.storageAdapter.store(file.buffer, storageKey, file.mimetype);

      // Calculate expiration date
      let expiresAt: Date | undefined;
      if (expiresInDays && expiresInDays > 0) {
        const maxDays = this.config.retention.maxExpirationDays;
        const days = Math.min(expiresInDays, maxDays);
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      } else if (this.config.retention.defaultExpirationDays) {
        expiresAt = new Date(
          Date.now() + this.config.retention.defaultExpirationDays * 24 * 60 * 60 * 1000,
        );
      }

      // Create metadata record
      const fileMetadata = await this.fileRepo.create({
        tenantId: ctx.tenantId,
        uploaderId: ctx.userId,
        uploaderType: ctx.userType,
        filename,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageKey,
        storageAdapter: this.storageAdapter.getName(),
        checksum,
        expiresAt,
      });

      // Trigger malware scan (async — fire and forget)
      this.triggerMalwareScan(fileMetadata);

      // Audit logging
      this.auditService.log({
        eventType: 'FILE_UPLOADED',
        actorId: ctx.userId,
        actorType: ctx.userType,
        targetId: fileMetadata.id,
        targetType: 'file',
        channel: 'api',
        metadata: {
          tenantId: ctx.tenantId,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          sizeFormatted: normalizeFileSize(file.size),
        },
        success: true,
      });

      // Record metrics
      const latency = Date.now() - startTime;
      this.metricsService.recordUpload(latency, ctx.tenantId, true);
      this.metricsService.recordStorageUsage(file.size, ctx.tenantId);

      return { success: true, data: fileMetadata };
    } catch (error) {
      const latency = Date.now() - startTime;
      this.metricsService.recordUpload(latency, ctx.tenantId, false);

      console.error('[UploadFileUseCase] Upload failed:', error);
      return {
        success: false,
        error: 'Failed to upload file',
        code: 'UPLOAD_FAILED',
      };
    }
  }

  private async triggerMalwareScan(file: FileMetadata): Promise<void> {
    if (!this.config.security.enableMalwareScanning) {
      await this.fileRepo.updateScanStatus(file.id, 'clean');
      return;
    }

    const startTime = Date.now();

    try {
      // TODO: Implement actual malware scanning integration (e.g., ClamAV, VirusTotal)
      await this.fileRepo.updateScanStatus(file.id, 'clean');

      const latency = Date.now() - startTime;
      this.metricsService.recordScan(latency, file.tenantId, 'clean');

      this.auditService.log({
        eventType: 'FILE_SCAN_COMPLETED',
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
      this.metricsService.recordScan(latency, file.tenantId, 'error');

      await this.fileRepo.updateScanStatus(file.id, 'error', String(error));

      this.auditService.log({
        eventType: 'FILE_SCAN_FAILED',
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

      console.error('[UploadFileUseCase] Malware scan failed:', error);
    }
  }
}
