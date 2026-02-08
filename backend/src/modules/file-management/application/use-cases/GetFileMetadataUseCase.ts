/**
 * GetFileMetadata Use Case
 * Retrieves file metadata with tenant scoping.
 */
import type { IFileRepository } from '../../domain/ports/IFileRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { FileMetadata, OperationResult, RequestContext } from '../../domain/entities/index.js';

export class GetFileMetadataUseCase {
  constructor(
    private readonly fileRepo: IFileRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(
    ctx: RequestContext,
    fileId: string,
  ): Promise<OperationResult<FileMetadata>> {
    const file = await this.fileRepo.findByIdForTenant(fileId, ctx.tenantId);
    if (!file) {
      this.auditService.log({
        eventType: 'FILE_ACCESS_DENIED',
        actorId: ctx.userId,
        actorType: ctx.userType,
        targetId: fileId,
        targetType: 'file',
        channel: 'api',
        metadata: { tenantId: ctx.tenantId, reason: 'Metadata access denied' },
        success: false,
      });

      return {
        success: false,
        error: 'File not found',
        code: 'FILE_NOT_FOUND',
      };
    }

    return { success: true, data: file };
  }
}
