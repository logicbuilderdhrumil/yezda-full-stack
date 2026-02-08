/**
 * Delete Candidate Use Case
 */

import type { ICandidateRepository } from '../../domain/ports/candidate-repository.port.js';
import type { IAuditService } from '../../domain/ports/audit-service.port.js';
import type { IMetricsService } from '../../domain/ports/metrics-service.port.js';
import type {
  CandidateManagementResult,
  CandidateManagementContext,
} from '../../domain/entities/candidate.entity.js';

export class DeleteCandidateUseCase {
  constructor(
    private readonly candidateRepo: ICandidateRepository,
    private readonly auditService: IAuditService,
    private readonly metricsService: IMetricsService,
  ) {}

  async execute(
    candidateId: string,
    ctx: CandidateManagementContext,
  ): Promise<CandidateManagementResult<void>> {
    const startTime = Date.now();

    // Only admins can delete candidates
    if (!ctx.actorRoles.includes('admin')) {
      this.auditService.log({
        eventType: 'GUARD_ROLE_DENIED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'candidate_management_delete',
          tenantId: ctx.tenantId,
          reason: 'Only admins can delete candidates',
          actorRoles: ctx.actorRoles,
        },
        success: false,
        errorMessage: 'Only admins can delete candidates',
      });
      return {
        success: false,
        error: 'Only admins can delete candidates',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      const existingCandidate = await this.candidateRepo.findById(candidateId, ctx.tenantId);
      if (!existingCandidate) {
        return {
          success: false,
          error: 'Candidate not found',
          errorCode: 'NOT_FOUND',
        };
      }

      const deleted = await this.candidateRepo.delete(candidateId, ctx.tenantId);

      if (!deleted) {
        return {
          success: false,
          error: 'Failed to delete candidate',
          errorCode: 'INTERNAL_ERROR',
        };
      }

      this.auditService.log({
        eventType: 'CANDIDATE_DELETED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: candidateId,
        targetType: 'candidate',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'candidate_delete',
          tenantId: ctx.tenantId,
          deletedCandidateEmail: existingCandidate.email,
        },
        success: true,
      });

      this.metricsService.incrementCounter('candidate_management_success', { operation: 'delete' });
      this.metricsService.recordLatency('candidate_management_request_latency', Date.now() - startTime, {
        operation: 'delete',
      });

      return { success: true };
    } catch (error) {
      console.error('[CandidateManagement] Delete candidate error:', error);
      this.metricsService.incrementCounter('candidate_management_error', { operation: 'delete' });
      return {
        success: false,
        error: 'Failed to delete candidate',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }
}
