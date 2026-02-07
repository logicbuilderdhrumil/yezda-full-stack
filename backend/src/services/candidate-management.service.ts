/**
 * Candidate Management Service
 * Task 1.2, 1.3, 1.5, 1.6: Business logic for candidate management operations
 * Enforces RBAC and tenant isolation at the service layer.
 */

import { v4 as uuidv4 } from 'uuid';
import { candidateManagementRepository } from '../repositories/candidate-management.repository.js';
import { auditService } from './audit.service.js';
import { metricsService } from './metrics.service.js';
import { globalCandidateIdentityService } from './global-candidate-identity.service.js';
import type {
  ManagedCandidate,
  CreateCandidateInput,
  UpdateCandidateInput,
  CandidateSearchParams,
  CandidateListResult,
  CandidateManagementResult,
  CandidateStatus,
  BulkCreateResult,
  CandidateSubmissionInput,
  SubmissionConfirmation,
  CandidateManagementContext,
} from '../models/candidate-management.model.js';
import type { UserRole } from '../middleware/route-guards.middleware.js';

/**
 * Check if actor has permission to manage candidates
 */
function canManageCandidates(roles: UserRole[]): boolean {
  return roles.includes('admin') || roles.includes('manager') || roles.includes('agent');
}

/**
 * Check if actor can certify candidates
 */
function canCertifyCandidates(roles: UserRole[]): boolean {
  return roles.includes('admin') || roles.includes('manager');
}

/**
 * Check if actor can archive candidates
 */
function canArchiveCandidates(roles: UserRole[]): boolean {
  return roles.includes('admin') || roles.includes('manager');
}

export class CandidateManagementService {
  /**
   * List candidates with search, filter, and pagination
   * Task 1.2: Implement candidate list endpoint
   * Task 1.4: Add certified and archived filters
   */
  async listCandidates(
    params: Omit<CandidateSearchParams, 'tenantId'>,
    ctx: CandidateManagementContext
  ): Promise<CandidateManagementResult<CandidateListResult>> {
    const startTime = Date.now();

    // Task 1.5: Check permissions
    if (!canManageCandidates(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'list', 'Insufficient permissions');
      metricsService.incrementCounter('candidate_management_access_denied', { operation: 'list' });
      return {
        success: false,
        error: 'Insufficient permissions to list candidates',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      const result = await candidateManagementRepository.search({
        ...params,
        tenantId: ctx.tenantId,
      });

      // Task 1.6: Audit log access
      auditService.log({
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

      metricsService.recordLatency('candidate_management_request_latency', Date.now() - startTime, {
        operation: 'list',
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('[CandidateManagement] List candidates error:', error);
      metricsService.incrementCounter('candidate_management_error', { operation: 'list' });
      return {
        success: false,
        error: 'Failed to list candidates',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Get candidate details by ID
   * Task 1.2: Implement candidate view endpoint
   */
  async getCandidateById(
    candidateId: string,
    ctx: CandidateManagementContext
  ): Promise<CandidateManagementResult<ManagedCandidate>> {
    const startTime = Date.now();

    // Task 1.5: Check permissions
    if (!canManageCandidates(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'view', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to view candidate details',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      const candidate = await candidateManagementRepository.findById(candidateId, ctx.tenantId);

      if (!candidate) {
        return {
          success: false,
          error: 'Candidate not found',
          errorCode: 'NOT_FOUND',
        };
      }

      // Task 1.6: Audit log access
      auditService.log({
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

      metricsService.recordLatency('candidate_management_request_latency', Date.now() - startTime, {
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

  /**
   * Create a new candidate
   * Task 1.2: Implement candidate create endpoint
   */
  async createCandidate(
    input: Omit<CreateCandidateInput, 'tenantId'>,
    ctx: CandidateManagementContext
  ): Promise<CandidateManagementResult<ManagedCandidate>> {
    const startTime = Date.now();

    // Task 1.5: Check permissions
    if (!canManageCandidates(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'create', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to create candidates',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      // Check if email already exists in this tenant
      const emailExists = await candidateManagementRepository.emailExists(
        input.email,
        ctx.tenantId
      );
      if (emailExists) {
        return {
          success: false,
          error: 'Email already exists for a candidate in this organization',
          errorCode: 'EMAIL_EXISTS',
        };
      }

      const candidateId = uuidv4();
      const candidate = await candidateManagementRepository.create({
        ...input,
        id: candidateId,
        tenantId: ctx.tenantId,
        createdBy: ctx.actorId,
      });

      // Resolve or create global identity for cross-org tracking
      try {
        await globalCandidateIdentityService.resolveOrCreateGlobalIdentity(
          input.email,
          input.firstName,
          input.lastName,
          ctx.tenantId,
          candidateId,
          ctx.actorId
        );
      } catch (globalIdError) {
        // Non-blocking: log but don't fail the candidate creation
        console.error('[CandidateManagement] Global identity resolution failed (non-blocking):', globalIdError);
      }

      // Task 1.6: Audit log creation
      auditService.log({
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

      metricsService.incrementCounter('candidate_management_success', { operation: 'create' });
      metricsService.recordLatency('candidate_management_request_latency', Date.now() - startTime, {
        operation: 'create',
      });

      return { success: true, data: candidate };
    } catch (error) {
      console.error('[CandidateManagement] Create candidate error:', error);
      metricsService.incrementCounter('candidate_management_error', { operation: 'create' });
      return {
        success: false,
        error: 'Failed to create candidate',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Update candidate details
   * Task 1.2: Implement candidate update endpoint
   */
  async updateCandidate(
    candidateId: string,
    input: UpdateCandidateInput,
    ctx: CandidateManagementContext
  ): Promise<CandidateManagementResult<ManagedCandidate>> {
    const startTime = Date.now();

    // Task 1.5: Check permissions
    if (!canManageCandidates(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'update', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to update candidates',
        errorCode: 'FORBIDDEN',
      };
    }

    // Check special status permissions
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
      // Get existing candidate first
      const existingCandidate = await candidateManagementRepository.findById(candidateId, ctx.tenantId);
      if (!existingCandidate) {
        return {
          success: false,
          error: 'Candidate not found',
          errorCode: 'NOT_FOUND',
        };
      }

      const updatedCandidate = await candidateManagementRepository.update(candidateId, ctx.tenantId, {
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

      // Task 1.6: Audit log changes
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

      auditService.log({
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

      metricsService.incrementCounter('candidate_management_success', { operation: 'update' });
      metricsService.recordLatency('candidate_management_request_latency', Date.now() - startTime, {
        operation: 'update',
      });

      return { success: true, data: updatedCandidate };
    } catch (error) {
      console.error('[CandidateManagement] Update candidate error:', error);
      metricsService.incrementCounter('candidate_management_error', { operation: 'update' });
      return {
        success: false,
        error: 'Failed to update candidate',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Update candidate status
   * Task 1.2: Implement candidate status update endpoint
   */
  async updateCandidateStatus(
    candidateId: string,
    status: CandidateStatus,
    ctx: CandidateManagementContext
  ): Promise<CandidateManagementResult<ManagedCandidate>> {
    const startTime = Date.now();

    // Task 1.5: Check base permissions
    if (!canManageCandidates(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'status_update', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to update candidate status',
        errorCode: 'FORBIDDEN',
      };
    }

    // Check special status permissions
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
      const existingCandidate = await candidateManagementRepository.findById(candidateId, ctx.tenantId);
      if (!existingCandidate) {
        return {
          success: false,
          error: 'Candidate not found',
          errorCode: 'NOT_FOUND',
        };
      }

      const updatedCandidate = await candidateManagementRepository.updateStatus(
        candidateId,
        ctx.tenantId,
        status,
        ctx.actorId
      );

      if (!updatedCandidate) {
        return {
          success: false,
          error: 'Failed to update candidate status',
          errorCode: 'INTERNAL_ERROR',
        };
      }

      // Task 1.6: Audit log status change
      auditService.log({
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

      metricsService.incrementCounter('candidate_management_success', { operation: 'status_update' });
      metricsService.recordLatency('candidate_management_request_latency', Date.now() - startTime, {
        operation: 'status_update',
      });

      return { success: true, data: updatedCandidate };
    } catch (error) {
      console.error('[CandidateManagement] Update status error:', error);
      metricsService.incrementCounter('candidate_management_error', { operation: 'status_update' });
      return {
        success: false,
        error: 'Failed to update candidate status',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Bulk create candidates
   * Task 1.3: Implement bulk-create endpoint
   */
  async bulkCreateCandidates(
    candidates: Array<Omit<CreateCandidateInput, 'tenantId'>>,
    ctx: CandidateManagementContext
  ): Promise<CandidateManagementResult<BulkCreateResult>> {
    const startTime = Date.now();

    // Task 1.5: Check permissions
    if (!canManageCandidates(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'bulk_create', 'Insufficient permissions');
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
      // Validate all emails for duplicates first
      const validCandidates: Array<CreateCandidateInput & { id: string; createdBy?: string }> = [];
      
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        const emailExists = await candidateManagementRepository.emailExists(
          candidate.email,
          ctx.tenantId
        );

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

      // Bulk insert valid candidates
      if (validCandidates.length > 0) {
        const createdCandidates = await candidateManagementRepository.bulkCreate(validCandidates);
        result.candidates = createdCandidates;
        result.created = createdCandidates.length;
      }

      // Task 1.6: Audit log bulk creation
      auditService.log({
        eventType: 'AUTH_SIGN_UP',
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

      metricsService.incrementCounter('candidate_management_success', { operation: 'bulk_create' });
      metricsService.recordLatency('candidate_management_request_latency', Date.now() - startTime, {
        operation: 'bulk_create',
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('[CandidateManagement] Bulk create error:', error);
      metricsService.incrementCounter('candidate_management_error', { operation: 'bulk_create' });
      return {
        success: false,
        error: 'Failed to bulk create candidates',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Public candidate submission form
   * Task 1.3: Implement submission form endpoint
   */
  async submitCandidateForm(
    tenantId: string,
    input: CandidateSubmissionInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<CandidateManagementResult<SubmissionConfirmation>> {
    const startTime = Date.now();

    try {
      // Verify tenant exists
      const tenantExists = await candidateManagementRepository.tenantExists(tenantId);
      if (!tenantExists) {
        return {
          success: false,
          error: 'Invalid organization',
          errorCode: 'INVALID_TENANT',
        };
      }

      // Check if email already exists
      const emailExists = await candidateManagementRepository.emailExists(input.email, tenantId);
      if (emailExists) {
        return {
          success: false,
          error: 'A submission with this email already exists',
          errorCode: 'EMAIL_EXISTS',
        };
      }

      const candidateId = uuidv4();
      await candidateManagementRepository.create({
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

      // Task 1.6: Audit log submission
      auditService.log({
        eventType: 'AUTH_SIGN_UP',
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

      metricsService.incrementCounter('candidate_management_success', { operation: 'submission' });
      metricsService.recordLatency('candidate_management_request_latency', Date.now() - startTime, {
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
      metricsService.incrementCounter('candidate_management_error', { operation: 'submission' });
      return {
        success: false,
        error: 'Failed to submit application',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Delete candidate
   * Task 1.2: Implement candidate delete endpoint (admin only)
   */
  async deleteCandidate(
    candidateId: string,
    ctx: CandidateManagementContext
  ): Promise<CandidateManagementResult<void>> {
    const startTime = Date.now();

    // Only admins can delete candidates
    if (!ctx.actorRoles.includes('admin')) {
      this.logAccessDenied(ctx, 'delete', 'Only admins can delete candidates');
      return {
        success: false,
        error: 'Only admins can delete candidates',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      const existingCandidate = await candidateManagementRepository.findById(candidateId, ctx.tenantId);
      if (!existingCandidate) {
        return {
          success: false,
          error: 'Candidate not found',
          errorCode: 'NOT_FOUND',
        };
      }

      const deleted = await candidateManagementRepository.delete(candidateId, ctx.tenantId);

      if (!deleted) {
        return {
          success: false,
          error: 'Failed to delete candidate',
          errorCode: 'INTERNAL_ERROR',
        };
      }

      // Task 1.6: Audit log deletion
      auditService.log({
        eventType: 'SHELL_PREFERENCE_UPDATED',
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

      metricsService.incrementCounter('candidate_management_success', { operation: 'delete' });
      metricsService.recordLatency('candidate_management_request_latency', Date.now() - startTime, {
        operation: 'delete',
      });

      return { success: true };
    } catch (error) {
      console.error('[CandidateManagement] Delete candidate error:', error);
      metricsService.incrementCounter('candidate_management_error', { operation: 'delete' });
      return {
        success: false,
        error: 'Failed to delete candidate',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Helper to log access denied events
   * Task 1.6: Add audit logging for access denial
   */
  private logAccessDenied(
    ctx: CandidateManagementContext,
    operation: string,
    reason: string
  ): void {
    auditService.log({
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

export const candidateManagementService = new CandidateManagementService();
