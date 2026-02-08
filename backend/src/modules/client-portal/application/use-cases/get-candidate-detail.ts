/**
 * Use Case: Get Candidate Detail
 */
import type { CandidateDetail, RequestContext, OperationResult } from '../domain/index.js';
import type { IClientPortalRepository } from '../domain/ports/IClientPortalRepository.js';
import type { IAuditService } from '../domain/ports/IAuditService.js';

export class GetCandidateDetailUseCase {
  constructor(
    private readonly repo: IClientPortalRepository,
    private readonly audit: IAuditService,
  ) {}

  execute(ctx: RequestContext, candidateId: string): OperationResult<CandidateDetail> {
    try {
      const detail = this.repo.getCandidateDetail(ctx.tenantId, candidateId);
      if (!detail) {
        return { success: false, error: 'Candidate not found', code: 'NOT_FOUND' };
      }
      this.audit.log('CLIENT_PORTAL_CANDIDATE_VIEWED', ctx, { candidateId });
      return { success: true, data: detail };
    } catch {
      return { success: false, error: 'Failed to get candidate detail', code: 'DETAIL_FAILED' };
    }
  }
}
