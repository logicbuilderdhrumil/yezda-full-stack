/**
 * Get Candidate By ID Use Case
 */

import type { ICandidateRepository } from '../../domain/ports/candidate-repository.port.js';
import type { IAuditService } from '../../domain/ports/audit-service.port.js';
import type { IMetricsService } from '../../domain/ports/metrics-service.port.js';
import type {
  ManagedCandidate,
  CandidateManagementResult,
  CandidateManagementContext,
} from '../../domain/entities/candidate.entity.js';
import { canManageCandidates } from '../../domain/services/candidate-authorization.service.js';

export class GetCandidateByIdUseCase {
  constructor(
    private readonly candidateRepo: ICandidateRepository,
    private readonly auditService: IAuditService,
    private readonly metricsService: IMetricsService,
  ) {}

  async execute(
    candidateId: string,
    ctx: CandidateManagementContext,
  ): Promise<CandidateManagementResult<ManagedCandidate>> {
    const startTime = Date.now();

    if (!canManageCandidates(ctx.actorRoles)) {
      this.auditService.log({
        eventType: 'GUARD_ROLE_DENIED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'candidate_management_view',
          tenantId: ctx.tenantId,
          reason: 'Insufficient permissions',
          actorRoles: ctx.actorRoles,
        },
        success: false,
        errorMessage: 'Insufficient permissions',
      });
      return {
        success: false,
        error: 'Insufficient permissions to view candidate details',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      const candidate = await this.candidateRepo.findById(candidateId, ctx.tenantId);

      if (!candidate) {
        return {
          success: false,
          error: 'Candidate not found',
          errorCode: 'NOT_FOUND',
        };
      }

      this.auditService.log({
        eventType: 'GUARD_ACCESS_GRANTED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: candidateId,
        targetType: 'candidate',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'candidate_view',
          tenantId: ctx.tenantId,
        },
        success: true,
      });

      this.metricsService.recordLatency('candidate_management_request_latency', Date.now() - startTime, {
        operation: 'view',
      });

      return { success: true, data: candidate };
    } catch (error) {
      console.error('[CandidateManagement] Get candidate error:', error);
      return {
        success: false,
        error: 'Failed to get candidate details',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }
}
