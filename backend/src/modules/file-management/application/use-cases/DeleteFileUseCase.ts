/**
 * DeleteFile Use Case
 * Soft-deletes a file with tenant verification and audit logging.
 */
import type { IFileRepository } from '../../domain/ports/IFileRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { OperationResult, RequestContext } from '../../domain/entities/index.js';

export class DeleteFileUseCase {
  constructor(
    private readonly fileRepo: IFileRepository,
    private readonly auditService: IAuditService,
  ) {}

  async execute(
    ctx: RequestContext,
    fileId: string,
  ): Promise<OperationResult<{ message: string }>> {
    // Verify tenant ownership
    const file = await this.fileRepo.findByIdForTenant(fileId, ctx.tenantId);
    if (!file) {
      return {
        success: false,
        error: 'File not found',
        code: 'FILE_NOT_FOUND',
      };
    }

    // Soft delete metadata
    await this.fileRepo.softDelete(fileId);

    // Note: Actual file deletion from storage can be deferred to a cleanup job
    this.auditService.log({
      eventType: 'FILE_DELETED',
      actorId: ctx.userId,
      actorType: ctx.userType,
      targetId: fileId,
      targetType: 'file',
      channel: 'api',
      ipAddress: ctx.ipAddress,
      metadata: {
        tenantId: ctx.tenantId,
        filename: file.originalFilename,
      },
      success: true,
    });

    return { success: true, data: { message: 'File deleted successfully' } };
  }
}
