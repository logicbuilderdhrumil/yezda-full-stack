/**
 * DownloadFile Use Case
 * Verifies tenant ownership, checks file status, retrieves content, and audits.
 */
import type { IFileRepository } from '../../domain/ports/IFileRepository.js';
import type { IStorageAdapter } from '../../domain/ports/IStorageAdapter.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { IFileMetricsService } from '../../domain/ports/IFileMetricsService.js';
import type { FileMetadata, OperationResult, RequestContext } from '../../domain/entities/index.js';

interface DownloadData {
  file: FileMetadata;
  buffer: Buffer;
}

export class DownloadFileUseCase {
  constructor(
    private readonly fileRepo: IFileRepository,
    private readonly storageAdapter: IStorageAdapter,
    private readonly auditService: IAuditService,
    private readonly metricsService: IFileMetricsService,
  ) {}

  async execute(
    ctx: RequestContext,
    fileId: string,
  ): Promise<OperationResult<DownloadData>> {
    const startTime = Date.now();

    try {
      // Verify tenant ownership
      const file = await this.fileRepo.findByIdForTenant(fileId, ctx.tenantId);
      if (!file) {
        this.auditService.log({
          eventType: 'FILE_ACCESS_DENIED',
          actorId: ctx.userId,
          actorType: ctx.userType,
          targetId: fileId,
          targetType: 'file',
          channel: 'api',
          ipAddress: ctx.ipAddress,
          metadata: {
            tenantId: ctx.tenantId,
            reason: 'File not found or cross-tenant access',
          },
          success: false,
        });

        this.metricsService.recordDownload(Date.now() - startTime, ctx.tenantId, false);

        return {
          success: false,
          error: 'File not found',
          code: 'FILE_NOT_FOUND',
        };
      }

      // Check if file is expired
      if (file.expiresAt && file.expiresAt < new Date()) {
        return {
          success: false,
          error: 'File has expired',
          code: 'FILE_EXPIRED',
        };
      }

      // Check malware scan status
      if (file.scanStatus === 'infected') {
        return {
          success: false,
          error: 'File failed security scan',
          code: 'FILE_INFECTED',
        };
      }

      // Retrieve file from storage
      const buffer = await this.storageAdapter.retrieve(file.storageKey);
      if (!buffer) {
        return {
          success: false,
          error: 'File content not found',
          code: 'STORAGE_ERROR',
        };
      }

      // Update access count
      await this.fileRepo.incrementAccessCount(fileId);

      // Audit logging
      this.auditService.log({
        eventType: 'FILE_DOWNLOADED',
        actorId: ctx.userId,
        actorType: ctx.userType,
        targetId: fileId,
        targetType: 'file',
        channel: 'api',
        ipAddress: ctx.ipAddress,
        metadata: {
          tenantId: ctx.tenantId,
          filename: file.originalFilename,
          size: file.size,
        },
        success: true,
      });

      // Record metrics
      const latency = Date.now() - startTime;
      this.metricsService.recordDownload(latency, ctx.tenantId, true);

      return { success: true, data: { file, buffer } };
    } catch (error) {
      const latency = Date.now() - startTime;
      this.metricsService.recordDownload(latency, ctx.tenantId, false);

      console.error('[DownloadFileUseCase] Download failed:', error);
      return {
        success: false,
        error: 'Failed to download file',
        code: 'DOWNLOAD_FAILED',
      };
    }
  }
}
