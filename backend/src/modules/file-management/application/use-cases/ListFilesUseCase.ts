/**
 * ListFiles Use Case
 * Returns a paginated file list for a tenant.
 */
import type { IFileRepository } from '../../domain/ports/IFileRepository.js';
import type { FileListResult, OperationResult, RequestContext } from '../../domain/entities/index.js';

export class ListFilesUseCase {
  constructor(private readonly fileRepo: IFileRepository) {}

  async execute(
    ctx: RequestContext,
    options: {
      uploaderId?: string;
      mimeType?: string;
      limit?: number;
      offset?: number;
    },
  ): Promise<OperationResult<FileListResult>> {
    const result = await this.fileRepo.list({
      tenantId: ctx.tenantId,
      uploaderId: options.uploaderId,
      mimeType: options.mimeType,
      limit: options.limit,
      offset: options.offset,
    });

    return { success: true, data: result };
  }
}
