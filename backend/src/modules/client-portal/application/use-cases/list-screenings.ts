/**
 * Use Case: List Screenings
 */
import type { ScreeningListResponse, RequestContext, OperationResult } from '../../domain/index.js';
import type { IClientPortalRepository } from '../../domain/ports/IClientPortalRepository.js';

export class ListScreeningsUseCase {
  constructor(private readonly repo: IClientPortalRepository) {}

  execute(
    ctx: RequestContext,
    params: { page?: number; limit?: number; status?: string; type?: string; candidateId?: string },
  ): OperationResult<ScreeningListResponse> {
    try {
      const result = this.repo.listScreenings(ctx.tenantId, params);
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: 'Failed to list screenings', code: 'LIST_SCREENINGS_FAILED' };
    }
  }
}
