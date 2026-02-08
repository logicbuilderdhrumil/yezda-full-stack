/**
 * Use Case: List Candidates
 */
import type { PaginatedCandidateList, RequestContext, OperationResult } from '../../domain/index.js';
import type { IClientPortalRepository } from '../../domain/ports/IClientPortalRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';

export class ListCandidatesUseCase {
  constructor(
    private readonly repo: IClientPortalRepository,
    private readonly audit: IAuditService,
  ) {}

  execute(
    ctx: RequestContext,
    params: { page?: number; limit?: number; search?: string; status?: string },
  ): OperationResult<PaginatedCandidateList> {
    try {
      const result = this.repo.listCandidates(ctx.tenantId, params);
      this.audit.log('CLIENT_PORTAL_CANDIDATES_LISTED', ctx, { params });
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: 'Failed to list candidates', code: 'LIST_CANDIDATES_FAILED' };
    }
  }
}
