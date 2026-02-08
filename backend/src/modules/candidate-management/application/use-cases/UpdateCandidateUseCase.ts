/**
 * Update Candidate Use Case
 */

import type { ICandidateRepository } from '../../domain/ports/candidate-repository.port.js';
import type { IAuditService } from '../../domain/ports/audit-service.port.js';
import type { IMetricsService } from '../../domain/ports/metrics-service.port.js';
import type {
  ManagedCandidate,
  UpdateCandidateInput,
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

export class UpdateCandidateUseCase {
  constructor(
    private readonly candidateRepo: ICandidateRepository,
    private readonly auditService: IAuditService,
    private readonly metricsService: IMetricsService,
  ) {}

  async execute(
    candidateId: string,
    input: UpdateCandidateInput,
    ctx: CandidateManagementContext,
  ): Promise<CandidateManagementResult<ManagedCandidate>> {
    const startTime = Date.now();

    if (!canManageCandidates(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'update', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to update candidates',
        errorCode: 'FORBIDDEN',
      };
    }

    if (input.status === 'certified' && !canCertifyCandidates(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'update', 'Cannot certify candidates');
      return {
        success: false,
        error: 'Insufficient permissions to certify candidates',
        errorCode: 'FORBIDDEN',
      };
    }

    if (input.status === 'archived' && !canArchiveCandidates(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'update', 'Cannot archive candidates');
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

      const updatedCandidate = await this.candidateRepo.update(candidateId, ctx.tenantId, {
        ...input,
        updatedBy: ctx.actorId,
      });

      if (!updatedCandidate) {
        return {
          success: false,
          error: 'Failed to update candidate',
          errorCode: 'INTERNAL_ERROR',
        };
      }

      const changes: Record<string, unknown> = {};
      if (input.status && input.status !== existingCandidate.status) {
        changes.status = { from: existingCandidate.status, to: input.status };
      }
      if (input.firstName !== undefined && input.firstName !== existingCandidate.firstName) {
        changes.firstName = { from: existingCandidate.firstName, to: input.firstName };
      }
      if (input.lastName !== undefined && input.lastName !== existingCandidate.lastName) {
        changes.lastName = { from: existingCandidate.lastName, to: input.lastName };
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
          operation: 'candidate_update',
          tenantId: ctx.tenantId,
          changes,
        },
        success: true,
      });

      this.metricsService.incrementCounter('candidate_management_success', { operation: 'update' });
      this.metricsService.recordLatency('candidate_management_request_latency', Date.now() - startTime, {
        operation: 'update',
      });

      return { success: true, data: updatedCandidate };
    } catch (error) {
      console.error('[CandidateManagement] Update candidate error:', error);
      this.metricsService.incrementCounter('candidate_management_error', { operation: 'update' });
      return {
        success: false,
        error: 'Failed to update candidate',
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
