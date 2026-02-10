/**
 * Review Task Service
 *
 * Manages human review tasks for pipeline stages that require manual decision-making.
 * Supports task creation, assignment, decision submission, and escalation.
 *
 * Phase 4.6-4.11: Human review module implementation.
 */

import { v4 as uuidv4 } from 'uuid';
import { auditService } from './audit.service.js';
import { metricsService } from './metrics.service.js';
import type {
  ReviewTask,
  ReviewDecision,
  CreateReviewTaskDto,
  ReviewDecisionDto,
  AssignReviewTaskDto,
  ReviewTaskFilter,
  ReviewTaskOperationResult,
} from '../models/review-task.model.js';
import {
  CreateReviewTaskSchema,
  ReviewDecisionSchema,
  AssignReviewTaskSchema,
  ReviewTaskFilterSchema,
} from '../models/review-task.model.js';
import type { PipelineContext } from '../models/screening-pipeline.model.js';

// ---------------------------------------------------------------------------
// Metrics constants
// ---------------------------------------------------------------------------

export const REVIEW_TASK_METRICS = {
  CREATE_REQUEST: 'review_task_create_total',
  CREATE_SUCCESS: 'review_task_create_success_total',
  CREATE_FAILURE: 'review_task_create_failure_total',
  ASSIGN_REQUEST: 'review_task_assign_total',
  ASSIGN_SUCCESS: 'review_task_assign_success_total',
  DECISION_REQUEST: 'review_task_decision_total',
  DECISION_SUCCESS: 'review_task_decision_success_total',
  DECISION_LATENCY: 'review_task_decision_latency_ms',
  ESCALATION_TRIGGERED: 'review_task_escalation_triggered_total',
  LIST_REQUEST: 'review_task_list_total',
  LIST_LATENCY: 'review_task_list_latency_ms',
  GET_REQUEST: 'review_task_get_total',
  QUEUE_REQUEST: 'review_task_queue_total',
  EXPIRED_CHECK: 'review_task_expired_check_total',
} as const;

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class ReviewTaskService {
  /** In-memory store of review tasks (replace with DB in production) */
  private tasks: Map<string, ReviewTask> = new Map();

  // -----------------------------------------------------------------------
  // Create
  // -----------------------------------------------------------------------

  /**
   * Create a new review task for a pipeline stage.
   */
  async createReviewTask(
    dto: CreateReviewTaskDto,
    ctx: PipelineContext,
  ): Promise<ReviewTaskOperationResult> {
    const startMs = Date.now();
    metricsService.incrementCounter(REVIEW_TASK_METRICS.CREATE_REQUEST, {
      tenantId: ctx.tenantId,
    });

    // Permission check: only admin/manager can create
    if (!ctx.actorRoles.some((r) => ['platform_admin', 'platform_manager'].includes(r))) {
      return {
        success: false,
        error: 'Insufficient permissions to create review tasks',
        errorCode: 'FORBIDDEN',
      };
    }

    // Validate input
    const parsed = CreateReviewTaskSchema.safeParse(dto);
    if (!parsed.success) {
      metricsService.incrementCounter(REVIEW_TASK_METRICS.CREATE_FAILURE, {
        tenantId: ctx.tenantId,
      });
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join('; '),
        errorCode: 'VALIDATION_ERROR',
      };
    }

    const now = new Date();
    const dueAt = new Date(now.getTime() + parsed.data.timeoutHours * 60 * 60 * 1000);

    const task: ReviewTask = {
      id: uuidv4(),
      tenantId: ctx.tenantId,
      pipelineId: parsed.data.pipelineId,
      assignmentId: parsed.data.assignmentId,
      stageId: parsed.data.stageId,
      candidateId: parsed.data.candidateId,
      assigneeId: parsed.data.assigneeId ?? null,
      assigneeRole: parsed.data.assigneeRole,
      status: parsed.data.assigneeId ? 'assigned' : 'pending',
      decision: null,
      decisionNotes: null,
      reviewFormId: parsed.data.reviewFormId ?? null,
      reviewFormData: null,
      decisionOptions: parsed.data.decisionOptions,
      timeoutHours: parsed.data.timeoutHours,
      escalationPolicy: parsed.data.escalationPolicy,
      dueAt,
      decidedAt: null,
      decidedBy: null,
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(task.id, task);

    metricsService.incrementCounter(REVIEW_TASK_METRICS.CREATE_SUCCESS, {
      tenantId: ctx.tenantId,
    });
    metricsService.recordLatency(
      REVIEW_TASK_METRICS.DECISION_LATENCY,
      Date.now() - startMs,
      { operation: 'create' },
    );

    auditService.log({
      eventType: 'REVIEW_TASK_CREATED' as never,
      actorId: ctx.actorId,
      actorType: ctx.actorType,
      targetId: task.id,
      targetType: 'review_task',
      channel: ctx.channel as 'web' | 'mobile' | 'api' | 'socket',
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: {
        pipelineId: task.pipelineId,
        assignmentId: task.assignmentId,
        stageId: task.stageId,
        candidateId: task.candidateId,
        assigneeRole: task.assigneeRole,
        timeoutHours: task.timeoutHours,
      },
      success: true,
    });

    return { success: true, data: task };
  }

  // -----------------------------------------------------------------------
  // List
  // -----------------------------------------------------------------------

  /**
   * List review tasks for the tenant, with optional filters.
   */
  async listReviewTasks(
    filters: ReviewTaskFilter,
    ctx: PipelineContext,
  ): Promise<ReviewTaskOperationResult<ReviewTask[]>> {
    const startMs = Date.now();
    metricsService.incrementCounter(REVIEW_TASK_METRICS.LIST_REQUEST, {
      tenantId: ctx.tenantId,
    });

    // Permission check
    if (!ctx.actorRoles.some((r) => ['platform_admin', 'platform_manager', 'platform_agent'].includes(r))) {
      return {
        success: false,
        error: 'Insufficient permissions to list review tasks',
        errorCode: 'FORBIDDEN',
      };
    }

    const parsed = ReviewTaskFilterSchema.safeParse(filters);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join('; '),
        errorCode: 'VALIDATION_ERROR',
      };
    }

    let results = Array.from(this.tasks.values()).filter(
      (t) => t.tenantId === ctx.tenantId,
    );

    if (parsed.data.status) {
      results = results.filter((t) => t.status === parsed.data.status);
    }
    if (parsed.data.assigneeRole) {
      results = results.filter((t) => t.assigneeRole === parsed.data.assigneeRole);
    }
    if (parsed.data.assigneeId) {
      results = results.filter((t) => t.assigneeId === parsed.data.assigneeId);
    }

    metricsService.recordLatency(
      REVIEW_TASK_METRICS.LIST_LATENCY,
      Date.now() - startMs,
      { tenantId: ctx.tenantId },
    );

    return { success: true, data: results };
  }

  // -----------------------------------------------------------------------
  // Get single
  // -----------------------------------------------------------------------

  /**
   * Get a single review task by ID.
   */
  async getReviewTask(
    id: string,
    ctx: PipelineContext,
  ): Promise<ReviewTaskOperationResult> {
    metricsService.incrementCounter(REVIEW_TASK_METRICS.GET_REQUEST, {
      tenantId: ctx.tenantId,
    });

    if (!ctx.actorRoles.some((r) => ['platform_admin', 'platform_manager', 'platform_agent'].includes(r))) {
      return {
        success: false,
        error: 'Insufficient permissions to view review tasks',
        errorCode: 'FORBIDDEN',
      };
    }

    const task = this.tasks.get(id);
    if (!task || task.tenantId !== ctx.tenantId) {
      return {
        success: false,
        error: 'Review task not found',
        errorCode: 'NOT_FOUND',
      };
    }

    return { success: true, data: task };
  }

  // -----------------------------------------------------------------------
  // Assign / Reassign
  // -----------------------------------------------------------------------

  /**
   * Assign or reassign a review task to a specific user.
   */
  async assignReviewTask(
    id: string,
    dto: AssignReviewTaskDto,
    ctx: PipelineContext,
  ): Promise<ReviewTaskOperationResult> {
    metricsService.incrementCounter(REVIEW_TASK_METRICS.ASSIGN_REQUEST, {
      tenantId: ctx.tenantId,
    });

    // Permission check: only admin/manager can assign
    if (!ctx.actorRoles.some((r) => ['platform_admin', 'platform_manager'].includes(r))) {
      return {
        success: false,
        error: 'Insufficient permissions to assign review tasks',
        errorCode: 'FORBIDDEN',
      };
    }

    const parsed = AssignReviewTaskSchema.safeParse(dto);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join('; '),
        errorCode: 'VALIDATION_ERROR',
      };
    }

    const task = this.tasks.get(id);
    if (!task || task.tenantId !== ctx.tenantId) {
      return {
        success: false,
        error: 'Review task not found',
        errorCode: 'NOT_FOUND',
      };
    }

    if (task.status === 'decided' || task.status === 'expired') {
      return {
        success: false,
        error: `Cannot assign a task with status '${task.status}'`,
        errorCode: 'INVALID_STATE',
      };
    }

    const previousAssignee = task.assigneeId;
    task.assigneeId = parsed.data.assigneeId;
    task.status = 'assigned';
    task.updatedAt = new Date();

    metricsService.incrementCounter(REVIEW_TASK_METRICS.ASSIGN_SUCCESS, {
      tenantId: ctx.tenantId,
    });

    auditService.log({
      eventType: 'REVIEW_TASK_ASSIGNED' as never,
      actorId: ctx.actorId,
      actorType: ctx.actorType,
      targetId: task.id,
      targetType: 'review_task',
      channel: ctx.channel as 'web' | 'mobile' | 'api' | 'socket',
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: {
        assigneeId: parsed.data.assigneeId,
        previousAssignee,
        stageId: task.stageId,
      },
      success: true,
    });

    return { success: true, data: task };
  }

  // -----------------------------------------------------------------------
  // Submit Decision
  // -----------------------------------------------------------------------

  /**
   * Submit a review decision for a task.
   */
  async submitDecision(
    id: string,
    dto: ReviewDecisionDto,
    ctx: PipelineContext,
  ): Promise<ReviewTaskOperationResult> {
    const startMs = Date.now();
    metricsService.incrementCounter(REVIEW_TASK_METRICS.DECISION_REQUEST, {
      tenantId: ctx.tenantId,
    });

    if (!ctx.actorRoles.some((r) => ['platform_admin', 'platform_manager', 'platform_agent'].includes(r))) {
      return {
        success: false,
        error: 'Insufficient permissions to submit decisions',
        errorCode: 'FORBIDDEN',
      };
    }

    const parsed = ReviewDecisionSchema.safeParse(dto);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join('; '),
        errorCode: 'VALIDATION_ERROR',
      };
    }

    const task = this.tasks.get(id);
    if (!task || task.tenantId !== ctx.tenantId) {
      return {
        success: false,
        error: 'Review task not found',
        errorCode: 'NOT_FOUND',
      };
    }

    if (task.status === 'decided' || task.status === 'expired') {
      return {
        success: false,
        error: `Cannot decide on a task with status '${task.status}'`,
        errorCode: 'INVALID_STATE',
      };
    }

    // Validate decision is in allowed options (if decision options constrain it)
    if (
      task.decisionOptions.length > 0 &&
      !task.decisionOptions.includes(parsed.data.decision)
    ) {
      return {
        success: false,
        error: `Decision '${parsed.data.decision}' is not in allowed options: ${task.decisionOptions.join(', ')}`,
        errorCode: 'INVALID_DECISION',
      };
    }

    const now = new Date();
    task.status = parsed.data.decision === 'escalated' ? 'escalated' : 'decided';
    task.decision = parsed.data.decision as ReviewDecision;
    task.decisionNotes = parsed.data.decisionNotes ?? null;
    task.reviewFormData = parsed.data.reviewFormData ?? null;
    task.decidedAt = now;
    task.decidedBy = ctx.actorId;
    task.updatedAt = now;

    const durationMs = Date.now() - startMs;
    metricsService.incrementCounter(REVIEW_TASK_METRICS.DECISION_SUCCESS, {
      tenantId: ctx.tenantId,
      decision: parsed.data.decision,
    });
    metricsService.recordLatency(
      REVIEW_TASK_METRICS.DECISION_LATENCY,
      durationMs,
      { decision: parsed.data.decision },
    );

    if (parsed.data.decision === 'escalated') {
      metricsService.incrementCounter(REVIEW_TASK_METRICS.ESCALATION_TRIGGERED, {
        tenantId: ctx.tenantId,
        action: task.escalationPolicy.action,
      });
    }

    auditService.log({
      eventType: 'REVIEW_TASK_DECIDED' as never,
      actorId: ctx.actorId,
      actorType: ctx.actorType,
      targetId: task.id,
      targetType: 'review_task',
      channel: ctx.channel as 'web' | 'mobile' | 'api' | 'socket',
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: {
        decision: parsed.data.decision,
        stageId: task.stageId,
        pipelineId: task.pipelineId,
        candidateId: task.candidateId,
        durationMs,
      },
      success: true,
    });

    return { success: true, data: task };
  }

  // -----------------------------------------------------------------------
  // My Queue
  // -----------------------------------------------------------------------

  /**
   * Get review tasks assigned to the current user or matching their roles.
   */
  async getMyReviewQueue(
    ctx: PipelineContext,
  ): Promise<ReviewTaskOperationResult<ReviewTask[]>> {
    metricsService.incrementCounter(REVIEW_TASK_METRICS.QUEUE_REQUEST, {
      tenantId: ctx.tenantId,
    });

    if (!ctx.actorRoles.some((r) => ['platform_admin', 'platform_manager', 'platform_agent'].includes(r))) {
      return {
        success: false,
        error: 'Insufficient permissions',
        errorCode: 'FORBIDDEN',
      };
    }

    const results = Array.from(this.tasks.values()).filter((t) => {
      if (t.tenantId !== ctx.tenantId) return false;
      // Exclude terminal states
      if (t.status === 'decided' || t.status === 'expired') return false;

      // Directly assigned to this user
      if (t.assigneeId === ctx.actorId) return true;

      // Unassigned tasks matching one of the actor's roles
      if (!t.assigneeId && ctx.actorRoles.includes(t.assigneeRole)) return true;

      return false;
    });

    return { success: true, data: results };
  }

  // -----------------------------------------------------------------------
  // Expiration Check
  // -----------------------------------------------------------------------

  /**
   * Check for expired tasks and trigger escalation policy.
   * Intended to be called by a scheduled job.
   */
  async checkExpiredTasks(): Promise<ReviewTaskOperationResult<ReviewTask[]>> {
    metricsService.incrementCounter(REVIEW_TASK_METRICS.EXPIRED_CHECK);

    const now = new Date();
    const expiredTasks: ReviewTask[] = [];

    for (const task of this.tasks.values()) {
      if (
        task.dueAt &&
        now > task.dueAt &&
        ['pending', 'assigned', 'in_review'].includes(task.status)
      ) {
        task.status = 'expired';
        task.updatedAt = now;

        // Apply escalation policy
        this.applyEscalationPolicy(task);

        expiredTasks.push(task);

        metricsService.incrementCounter(REVIEW_TASK_METRICS.ESCALATION_TRIGGERED, {
          action: task.escalationPolicy.action,
          tenantId: task.tenantId,
        });

        auditService.log({
          eventType: 'REVIEW_TASK_EXPIRED' as never,
          actorType: 'system',
          targetId: task.id,
          targetType: 'review_task',
          channel: 'api',
          metadata: {
            escalationAction: task.escalationPolicy.action,
            targetRole: task.escalationPolicy.targetRole,
            stageId: task.stageId,
            pipelineId: task.pipelineId,
          },
          success: true,
        });
      }
    }

    return { success: true, data: expiredTasks };
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /**
   * Apply the escalation policy for an expired task.
   * For now logs the action; real implementation would create new tasks or notifications.
   */
  private applyEscalationPolicy(task: ReviewTask): void {
    const { action, targetRole } = task.escalationPolicy;

    switch (action) {
      case 'reassign':
        // In production: create a new task assigned to targetRole
        console.error(
          `[ReviewTaskService] Escalation: reassigning task ${task.id} to role '${targetRole ?? 'platform_manager'}'`,
        );
        break;
      case 'notify_manager':
        console.error(
          `[ReviewTaskService] Escalation: notifying manager for task ${task.id}`,
        );
        break;
      case 'auto_approve':
        task.status = 'decided';
        task.decision = 'approved';
        task.decidedAt = new Date();
        task.decidedBy = 'system';
        console.error(
          `[ReviewTaskService] Escalation: auto-approved task ${task.id}`,
        );
        break;
      case 'auto_reject':
        task.status = 'decided';
        task.decision = 'rejected';
        task.decidedAt = new Date();
        task.decidedBy = 'system';
        console.error(
          `[ReviewTaskService] Escalation: auto-rejected task ${task.id}`,
        );
        break;
      default:
        console.error(
          `[ReviewTaskService] Unknown escalation action '${action}' for task ${task.id}`,
        );
    }
  }
}

/** Singleton instance */
export const reviewTaskService = new ReviewTaskService();
