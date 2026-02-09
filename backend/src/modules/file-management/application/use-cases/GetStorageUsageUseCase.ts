/**
 * GetStorageUsage Use Case
 * Returns storage usage statistics for a tenant.
 */
import type { IFileRepository } from '../../domain/ports/IFileRepository.js';
import type { OperationResult, RequestContext } from '../../domain/entities/index.js';
import { normalizeFileSize } from '../../domain/entities/index.js';

interface StorageUsageData {
  usedBytes: number;
  usedFormatted: string;
}

export class GetStorageUsageUseCase {
  constructor(private readonly fileRepo: IFileRepository) {}

  async execute(ctx: RequestContext): Promise<OperationResult<StorageUsageData>> {
    const usedBytes = await this.fileRepo.getTenantStorageUsed(ctx.tenantId);
    return {
      success: true,
      data: {
        usedBytes,
        usedFormatted: normalizeFileSize(usedBytes),
      },
    };
  }
}
