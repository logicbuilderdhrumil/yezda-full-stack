/**
 * Submit Candidate Form Use Case
 * Handles public (unauthenticated) candidate submissions.
 */

import { v4 as uuidv4 } from 'uuid';
import type { ICandidateRepository } from '../../domain/ports/candidate-repository.port.js';
import type { IAuditService } from '../../domain/ports/audit-service.port.js';
import type { IMetricsService } from '../../domain/ports/metrics-service.port.js';
import type {
  CandidateSubmissionInput,
  SubmissionConfirmation,
  CandidateManagementResult,
} from '../../domain/entities/candidate.entity.js';

export class SubmitCandidateFormUseCase {
  constructor(
    private readonly candidateRepo: ICandidateRepository,
    private readonly auditService: IAuditService,
    private readonly metricsService: IMetricsService,
  ) {}

  async execute(
    tenantId: string,
    input: CandidateSubmissionInput,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<CandidateManagementResult<SubmissionConfirmation>> {
    const startTime = Date.now();

    try {
      const tenantExists = await this.candidateRepo.tenantExists(tenantId);
      if (!tenantExists) {
        return {
          success: false,
          error: 'Invalid organization',
          errorCode: 'INVALID_TENANT',
        };
      }

      const emailExists = await this.candidateRepo.emailExists(input.email, tenantId);
      if (emailExists) {
        return {
          success: false,
          error: 'A submission with this email already exists',
          errorCode: 'EMAIL_EXISTS',
        };
      }

      const candidateId = uuidv4();
      await this.candidateRepo.create({
        id: candidateId,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        status: 'pending',
        tenantId,
        metadata: {
          ...input.metadata,
          consentGiven: input.consentGiven,
          submittedAt: new Date().toISOString(),
          submittedFrom: ipAddress,
        },
        createdBy: 'system',
      });

      this.auditService.log({
        eventType: 'CANDIDATE_SUBMISSION_RECEIVED',
        actorType: 'candidate',
        targetId: candidateId,
        targetType: 'candidate',
        channel: 'api',
        ipAddress,
        userAgent,
        metadata: {
          operation: 'candidate_submission',
          tenantId,
          email: input.email,
          consentGiven: input.consentGiven,
        },
        success: true,
      });

      this.metricsService.incrementCounter('candidate_management_success', { operation: 'submission' });
      this.metricsService.recordLatency('candidate_management_request_latency', Date.now() - startTime, {
        operation: 'submission',
      });

      return {
        success: true,
        data: {
          submissionId: candidateId,
          message: 'Your submission has been received successfully.',
          receivedAt: new Date(),
        },
      };
    } catch (error) {
      console.error('[CandidateManagement] Submission error:', error);
      this.metricsService.incrementCounter('candidate_management_error', { operation: 'submission' });
      return {
        success: false,
        error: 'Failed to submit application',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }
}
