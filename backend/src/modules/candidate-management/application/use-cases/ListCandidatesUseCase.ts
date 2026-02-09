/**
 * List Candidates Use Case
 */

import type { ICandidateRepository } from '../../domain/ports/candidate-repository.port.js';
import type { IAuditService } from '../../domain/ports/audit-service.port.js';
import type { IMetricsService } from '../../domain/ports/metrics-service.port.js';
import type {
  CandidateSearchParams,
  CandidateListResult,
  CandidateManagementResult,
  CandidateManagementContext,
} from '../../domain/entities/candidate.entity.js';
import { canManageCandidates } from '../../domain/services/candidate-authorization.service.js';

export class ListCandidatesUseCase {
  constructor(
    private readonly candidateRepo: ICandidateRepository,
    private readonly auditService: IAuditService,
    private readonly metricsService: IMetricsService,
  ) {}

  async execute(
    params: Omit<CandidateSearchParams, 'tenantId'>,
    ctx: CandidateManagementContext,
  ): Promise<CandidateManagementResult<CandidateListResult>> {
    const startTime = Date.now();

    if (!canManageCandidates(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'list', 'Insufficient permissions');
      this.metricsService.incrementCounter('candidate_management_access_denied', { operation: 'list' });
      return {
        success: false,
        error: 'Insufficient permissions to list candidates',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      const result = await this.candidateRepo.search({
        ...params,
        tenantId: ctx.tenantId,
      });

      this.auditService.log({
        eventType: 'GUARD_ACCESS_GRANTED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'candidate_list',
          tenantId: ctx.tenantId,
          resultCount: result.candidates.length,
          totalCount: result.total,
          filters: { ...params },
        },
        success: true,
      });

      this.metricsService.recordLatency('candidate_management_request_latency', Date.now() - startTime, {
        operation: 'list',
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('[CandidateManagement] List candidates error:', error);
      this.metricsService.incrementCounter('candidate_management_error', { operation: 'list' });
      return {
        success: false,
        error: 'Failed to list candidates',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  private logAccessDenied(ctx: CandidateManagementContext, operation: string, reason: string): void {
    this.auditService.log({
      eventType: 'GUARD_ROLE_DENIED',
      actorId: ctx.actorId,
      actorType: ctx.actorType,
      channel: ctx.channel,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: {
        operation: `candidate_management_${operation}`,
        tenantId: ctx.tenantId,
        reason,
        actorRoles: ctx.actorRoles,
      },
      success: false,
      errorMessage: reason,
    });
  }
}
