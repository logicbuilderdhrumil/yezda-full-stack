/**
 * Update Candidate Status Use Case
 */

import type { ICandidateRepository } from '../../domain/ports/candidate-repository.port.js';
import type { IAuditService } from '../../domain/ports/audit-service.port.js';
import type { IMetricsService } from '../../domain/ports/metrics-service.port.js';
import type {
  ManagedCandidate,
  CandidateStatus,
  CandidateManagementResult,
  CandidateManagementContext,
  UserRole,
} from '../../domain/entities/candidate.entity.js';

function canManageCandidates(roles: UserRole[]): boolean {
  return roles.includes('admin') || roles.includes('manager') || roles.includes('agent');
}

function canCertifyCandidates(roles: UserRole[]): boolean {
  return roles.includes('admin') || roles.includes('manager');
}

function canArchiveCandidates(roles: UserRole[]): boolean {
  return roles.includes('admin') || roles.includes('manager');
}

export class UpdateCandidateStatusUseCase {
  constructor(
    private readonly candidateRepo: ICandidateRepository,
    private readonly auditService: IAuditService,
    private readonly metricsService: IMetricsService,
  ) {}

  async execute(
    candidateId: string,
    status: CandidateStatus,
    ctx: CandidateManagementContext,
  ): Promise<CandidateManagementResult<ManagedCandidate>> {
    const startTime = Date.now();

    if (!canManageCandidates(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'status_update', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to update candidate status',
        errorCode: 'FORBIDDEN',
      };
    }

    if (status === 'certified' && !canCertifyCandidates(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'status_update', 'Cannot certify candidates');
      return {
        success: false,
        error: 'Insufficient permissions to certify candidates',
        errorCode: 'FORBIDDEN',
      };
    }

    if (status === 'archived' && !canArchiveCandidates(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'status_update', 'Cannot archive candidates');
      return {
        success: false,
        error: 'Insufficient permissions to archive candidates',
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

      const updatedCandidate = await this.candidateRepo.updateStatus(
        candidateId,
        ctx.tenantId,
        status,
        ctx.actorId,
      );

      if (!updatedCandidate) {
        return {
          success: false,
          error: 'Failed to update candidate status',
          errorCode: 'INTERNAL_ERROR',
        };
      }

      this.auditService.log({
        eventType: 'SHELL_PREFERENCE_UPDATED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: candidateId,
        targetType: 'candidate',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'candidate_status_change',
          tenantId: ctx.tenantId,
          previousStatus: existingCandidate.status,
          newStatus: status,
        },
        success: true,
      });

      this.metricsService.incrementCounter('candidate_management_success', { operation: 'status_update' });
      this.metricsService.recordLatency('candidate_management_request_latency', Date.now() - startTime, {
        operation: 'status_update',
      });

      return { success: true, data: updatedCandidate };
    } catch (error) {
      console.error('[CandidateManagement] Update status error:', error);
      this.metricsService.incrementCounter('candidate_management_error', { operation: 'status_update' });
      return {
        success: false,
        error: 'Failed to update candidate status',
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
