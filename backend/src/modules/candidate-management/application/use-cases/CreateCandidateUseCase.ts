/**
 * Create Candidate Use Case
 */

import { v4 as uuidv4 } from 'uuid';
import type { ICandidateRepository } from '../../domain/ports/candidate-repository.port.js';
import type { IAuditService } from '../../domain/ports/audit-service.port.js';
import type { IMetricsService } from '../../domain/ports/metrics-service.port.js';
import type { IGlobalCandidateIdentityService } from '../../domain/ports/global-candidate-identity-service.port.js';
import type {
  ManagedCandidate,
  CreateCandidateInput,
  CandidateManagementResult,
  CandidateManagementContext,
  UserRole,
} from '../../domain/entities/candidate.entity.js';

function canManageCandidates(roles: UserRole[]): boolean {
  return roles.includes('admin') || roles.includes('manager') || roles.includes('agent');
}

export class CreateCandidateUseCase {
  constructor(
    private readonly candidateRepo: ICandidateRepository,
    private readonly auditService: IAuditService,
    private readonly metricsService: IMetricsService,
    private readonly globalIdentityService: IGlobalCandidateIdentityService,
  ) {}

  async execute(
    input: Omit<CreateCandidateInput, 'tenantId'>,
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
          operation: 'candidate_management_create',
          tenantId: ctx.tenantId,
          reason: 'Insufficient permissions',
          actorRoles: ctx.actorRoles,
        },
        success: false,
        errorMessage: 'Insufficient permissions',
      });
      return {
        success: false,
        error: 'Insufficient permissions to create candidates',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      const emailExists = await this.candidateRepo.emailExists(input.email, ctx.tenantId);
      if (emailExists) {
        return {
          success: false,
          error: 'Email already exists for a candidate in this organization',
          errorCode: 'EMAIL_EXISTS',
        };
      }

      const candidateId = uuidv4();
      const candidate = await this.candidateRepo.create({
        ...input,
        id: candidateId,
        tenantId: ctx.tenantId,
        createdBy: ctx.actorId,
      });

      // Resolve or create global identity for cross-org tracking (non-blocking)
      try {
        await this.globalIdentityService.resolveOrCreateGlobalIdentity(
          input.email,
          input.firstName,
          input.lastName,
          ctx.tenantId,
          candidateId,
          ctx.actorId,
        );
      } catch (globalIdError) {
        console.error('[CandidateManagement] Global identity resolution failed (non-blocking):', globalIdError);
      }

      this.auditService.log({
        eventType: 'AUTH_SIGN_UP',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: candidateId,
        targetType: 'candidate',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'candidate_create',
          tenantId: ctx.tenantId,
          email: input.email,
          status: input.status ?? 'pending',
        },
        success: true,
      });

      this.metricsService.incrementCounter('candidate_management_success', { operation: 'create' });
      this.metricsService.recordLatency('candidate_management_request_latency', Date.now() - startTime, {
        operation: 'create',
      });

      return { success: true, data: candidate };
    } catch (error) {
      console.error('[CandidateManagement] Create candidate error:', error);
      this.metricsService.incrementCounter('candidate_management_error', { operation: 'create' });
      return {
        success: false,
        error: 'Failed to create candidate',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }
}
