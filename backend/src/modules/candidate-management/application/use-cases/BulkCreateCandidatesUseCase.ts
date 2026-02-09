/**
 * Bulk Create Candidates Use Case
 */

import { v4 as uuidv4 } from 'uuid';
import type { ICandidateRepository } from '../../domain/ports/candidate-repository.port.js';
import type { IAuditService } from '../../domain/ports/audit-service.port.js';
import type { IMetricsService } from '../../domain/ports/metrics-service.port.js';
import type {
  CreateCandidateInput,
  BulkCreateResult,
  CandidateManagementResult,
  CandidateManagementContext,
} from '../../domain/entities/candidate.entity.js';
import { canManageCandidates } from '../../domain/services/candidate-authorization.service.js';

export class BulkCreateCandidatesUseCase {
  constructor(
    private readonly candidateRepo: ICandidateRepository,
    private readonly auditService: IAuditService,
    private readonly metricsService: IMetricsService,
  ) {}

  async execute(
    candidates: Array<Omit<CreateCandidateInput, 'tenantId'>>,
    ctx: CandidateManagementContext,
  ): Promise<CandidateManagementResult<BulkCreateResult>> {
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
          operation: 'candidate_management_bulk_create',
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

    const result: BulkCreateResult = {
      created: 0,
      failed: 0,
      errors: [],
      candidates: [],
    };

    try {
      const validCandidates: Array<CreateCandidateInput & { id: string; createdBy?: string }> = [];

      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const emailExists = await this.candidateRepo.emailExists(candidate.email, ctx.tenantId);

        if (emailExists) {
          result.failed++;
          result.errors.push({
            index: i,
            email: candidate.email,
            error: 'Email already exists',
          });
        } else {
          validCandidates.push({
            ...candidate,
            id: uuidv4(),
            tenantId: ctx.tenantId,
            createdBy: ctx.actorId,
          });
        }
      }

      if (validCandidates.length > 0) {
        const createdCandidates = await this.candidateRepo.bulkCreate(validCandidates);
        result.candidates = createdCandidates;
        result.created = createdCandidates.length;
      }

      this.auditService.log({
        eventType: 'CANDIDATE_BULK_CREATED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'candidate_bulk_create',
          tenantId: ctx.tenantId,
          totalRequested: candidates.length,
          created: result.created,
          failed: result.failed,
        },
        success: true,
      });

      this.metricsService.incrementCounter('candidate_management_success', { operation: 'bulk_create' });
      this.metricsService.recordLatency('candidate_management_request_latency', Date.now() - startTime, {
        operation: 'bulk_create',
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('[CandidateManagement] Bulk create error:', error);
      this.metricsService.incrementCounter('candidate_management_error', { operation: 'bulk_create' });
      return {
        success: false,
        error: 'Failed to bulk create candidates',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }
}
