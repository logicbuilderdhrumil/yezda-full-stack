/**
 * Pipeline Runner Service
 *
 * Orchestrates stage transitions based on module type.
 * Routes each stage to its handler (form, external service, human review,
 * internal processing, notification) and advances the assignment through
 * the pipeline graph or ordered stage list.
 */

import { v4 as uuidv4 } from 'uuid';
import { screeningPipelineService } from './screening-pipeline.service.js';
import { externalServiceAdapterService } from './external-service-adapter.service.js';
import { reviewTaskService } from './review-task.service.js';
import { notificationDispatcherService } from './notification-dispatcher.service.js';
import { auditService } from './audit.service.js';
import { metricsService } from './metrics.service.js';
import type {
  ScreeningPipeline,
  PipelineStage,
  PipelineAssignment,
  PipelineContext,
} from '../models/screening-pipeline.model.js';
import type {
  ModuleType,
  PipelineGraph,
  ExternalServiceModuleConfig,
  HumanReviewModuleConfig,
  NotificationModuleConfig,
} from '../../../shared/@types/pipeline-modules.js';

// ---------------------------------------------------------------------------
// Result Types
// ---------------------------------------------------------------------------

export type PipelineExecutionStatus =
  | 'running'
  | 'waiting_for_input'
  | 'completed'
  | 'failed';

export interface PipelineExecutionResult {
  success: boolean;
  assignmentId: string;
  currentStageId?: string;
  status: PipelineExecutionStatus;
  error?: string;
  errorCode?: string;
}

export interface StageExecutionResult {
  success: boolean;
  stageId: string;
  status: 'completed' | 'waiting' | 'failed';
  data?: Record<string, unknown>;
  error?: string;
}

export interface ExecutionStatusDetail {
  assignmentId: string;
  pipelineId: string;
  pipelineName: string;
  overallStatus: PipelineExecutionStatus;
  progressPercentage: number;
  stages: Array<{
    stageId: string;
    name: string;
    moduleType: ModuleType;
    status: string;
    order: number;
  }>;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class PipelineRunnerService {
  /**
   * Start execution of a pipeline assignment.
   * Determines the first stage and executes it.
   */
  async startPipeline(
    assignmentId: string,
    ctx: PipelineContext
  ): Promise<PipelineExecutionResult> {
    const startTime = Date.now();
    console.log(`[PipelineRunner] Starting pipeline for assignment ${assignmentId}`);

    try {
      const progress = await screeningPipelineService.getAssignmentProgress(
        assignmentId,
        ctx
      );

      if (!progress.success || !progress.data) {
        return {
          success: false,
          assignmentId,
          status: 'failed',
          error: progress.error ?? 'Assignment not found',
          errorCode: progress.errorCode ?? 'NOT_FOUND',
        };
      }

      const { assignment, pipeline } = progress.data;

      if (assignment.status !== 'in_progress') {
        return {
          success: false,
          assignmentId,
          status: 'failed',
          error: 'Assignment is not in progress',
          errorCode: 'NOT_IN_PROGRESS',
        };
      }

      // Determine the first stage
      const firstStage = this.getFirstStage(pipeline);
      if (!firstStage) {
        return {
          success: false,
          assignmentId,
          status: 'failed',
          error: 'Pipeline has no stages',
          errorCode: 'NO_STAGES',
        };
      }

      // Execute the first stage
      const stageResult = await this.executeStage(
        firstStage,
        assignment,
        pipeline,
        ctx
      );

      auditService.log({
        eventType: 'GUARD_ACCESS_GRANTED' as never,
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: assignmentId,
        targetType: 'pipeline_assignment',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'pipeline_execution_started',
          tenantId: ctx.tenantId,
          pipelineId: pipeline.id,
          firstStageId: firstStage.id,
          firstStageModuleType: firstStage.moduleType,
        },
        success: true,
      });

      metricsService.incrementCounter('pipeline_execution_started', {
        moduleType: firstStage.moduleType,
      });
      metricsService.recordLatency(
        'pipeline_runner_latency',
        Date.now() - startTime,
        { operation: 'start' }
      );

      const executionStatus: PipelineExecutionStatus =
        stageResult.status === 'waiting' ? 'waiting_for_input' : 'running';

      return {
        success: stageResult.success,
        assignmentId,
        currentStageId: firstStage.id,
        status: executionStatus,
        error: stageResult.error,
      };
    } catch (error) {
      console.error('[PipelineRunner] Start pipeline error:', error);
      metricsService.incrementCounter('pipeline_execution_error', {
        operation: 'start',
      });
      return {
        success: false,
        assignmentId,
        status: 'failed',
        error: 'Failed to start pipeline execution',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Handle stage completion and advance to the next stage.
   */
  async handleStageCompletion(
    assignmentId: string,
    stageId: string,
    result: Record<string, unknown> | undefined,
    ctx: PipelineContext
  ): Promise<PipelineExecutionResult> {
    const startTime = Date.now();
    console.log(
      `[PipelineRunner] Stage ${stageId} completed for assignment ${assignmentId}`
    );

    try {
      // Complete the stage via the pipeline service
      const completionResult = await screeningPipelineService.completeStage(
        assignmentId,
        stageId,
        ctx
      );

      if (!completionResult.success || !completionResult.data) {
        return {
          success: false,
          assignmentId,
          status: 'failed',
          error: completionResult.error ?? 'Failed to complete stage',
          errorCode: completionResult.errorCode,
        };
      }

      const assignment = completionResult.data;

      // If the assignment is now completed, we're done
      if (assignment.status === 'completed') {
        console.log(
          `[PipelineRunner] Assignment ${assignmentId} completed all stages`
        );

        metricsService.incrementCounter('pipeline_execution_completed', {});
        metricsService.recordLatency(
          'pipeline_runner_latency',
          Date.now() - startTime,
          { operation: 'complete' }
        );

        return {
          success: true,
          assignmentId,
          status: 'completed',
        };
      }

      // Otherwise, advance to the next stage
      return this.advanceToNextStage(assignmentId, stageId, ctx);
    } catch (error) {
      console.error('[PipelineRunner] Stage completion error:', error);
      metricsService.incrementCounter('pipeline_execution_error', {
        operation: 'stage_completion',
      });
      return {
        success: false,
        assignmentId,
        status: 'failed',
        error: 'Failed to handle stage completion',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Advance to the next stage after a stage completes.
   */
  async advanceToNextStage(
    assignmentId: string,
    completedStageId: string,
    ctx: PipelineContext
  ): Promise<PipelineExecutionResult> {
    const startTime = Date.now();
    console.log(
      `[PipelineRunner] Advancing from stage ${completedStageId} for assignment ${assignmentId}`
    );

    try {
      const progress = await screeningPipelineService.getAssignmentProgress(
        assignmentId,
        ctx
      );

      if (!progress.success || !progress.data) {
        return {
          success: false,
          assignmentId,
          status: 'failed',
          error: progress.error ?? 'Assignment not found',
          errorCode: 'NOT_FOUND',
        };
      }

      const { assignment, pipeline } = progress.data;

      // Determine next stage from graph or order
      const nextStage = this.getNextStage(
        pipeline,
        completedStageId
      );

      if (!nextStage) {
        // No more stages — assignment should already be complete
        console.log(
          `[PipelineRunner] No more stages after ${completedStageId}`
        );
        return {
          success: true,
          assignmentId,
          status: 'completed',
        };
      }

      // Execute the next stage
      const stageResult = await this.executeStage(
        nextStage,
        assignment,
        pipeline,
        ctx
      );

      metricsService.recordLatency(
        'pipeline_runner_latency',
        Date.now() - startTime,
        { operation: 'advance' }
      );

      const executionStatus: PipelineExecutionStatus =
        stageResult.status === 'waiting' ? 'waiting_for_input' : 'running';

      return {
        success: stageResult.success,
        assignmentId,
        currentStageId: nextStage.id,
        status: executionStatus,
        error: stageResult.error,
      };
    } catch (error) {
      console.error('[PipelineRunner] Advance stage error:', error);
      metricsService.incrementCounter('pipeline_execution_error', {
        operation: 'advance',
      });
      return {
        success: false,
        assignmentId,
        status: 'failed',
        error: 'Failed to advance to next stage',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Execute a stage based on its moduleType.
   */
  async executeStage(
    stage: PipelineStage,
    assignment: PipelineAssignment,
    pipeline: ScreeningPipeline,
    ctx: PipelineContext
  ): Promise<StageExecutionResult> {
    const startTime = Date.now();
    const moduleType = stage.moduleType ?? 'form';

    console.log(
      `[PipelineRunner] Executing stage "${stage.name}" (${moduleType}) for assignment ${assignment.id}`
    );

    try {
      let result: StageExecutionResult;

      switch (moduleType) {
        case 'form':
          result = await this.executeFormStage(stage, assignment, ctx);
          break;
        case 'external_service':
          result = await this.executeExternalServiceStage(
            stage,
            assignment,
            ctx
          );
          break;
        case 'internal_processing':
          result = await this.executeInternalProcessingStage(
            stage,
            assignment,
            ctx
          );
          break;
        case 'human_review':
          result = await this.executeHumanReviewStage(
            stage,
            assignment,
            pipeline,
            ctx
          );
          break;
        case 'notification':
          result = await this.executeNotificationStage(
            stage,
            assignment,
            pipeline,
            ctx
          );
          break;
        default:
          result = {
            success: false,
            stageId: stage.id,
            status: 'failed',
            error: `Unknown module type: ${moduleType}`,
          };
      }

      metricsService.incrementCounter('pipeline_stage_executed', {
        moduleType,
        status: result.status,
      });
      metricsService.recordLatency(
        'pipeline_stage_execution_latency',
        Date.now() - startTime,
        { moduleType }
      );

      return result;
    } catch (error) {
      console.error(
        `[PipelineRunner] Execute stage "${stage.name}" error:`,
        error
      );
      return {
        success: false,
        stageId: stage.id,
        status: 'failed',
        error: `Stage execution failed: ${error instanceof Error ? error.message : 'Unknown'}`,
      };
    }
  }

  /**
   * Get detailed execution status for an assignment.
   */
  async getPipelineExecutionStatus(
    assignmentId: string,
    ctx: PipelineContext
  ): Promise<ExecutionStatusDetail | null> {
    const progress = await screeningPipelineService.getAssignmentProgress(
      assignmentId,
      ctx
    );

    if (!progress.success || !progress.data) {
      return null;
    }

    const { assignment, pipeline } = progress.data;

    const overallStatus: PipelineExecutionStatus =
      assignment.status === 'completed'
        ? 'completed'
        : Object.values(assignment.stageStatuses).some(
              (s) => s === 'in_progress'
            )
          ? 'running'
          : 'waiting_for_input';

    return {
      assignmentId,
      pipelineId: pipeline.id,
      pipelineName: pipeline.name,
      overallStatus,
      progressPercentage: assignment.progressPercentage,
      stages: pipeline.stages.map((stage) => ({
        stageId: stage.id,
        name: stage.name,
        moduleType: stage.moduleType ?? 'form',
        status: assignment.stageStatuses[stage.id] ?? 'pending',
        order: stage.order,
      })),
    };
  }

  // -----------------------------------------------------------------------
  // Private: Per-Module Handlers
  // -----------------------------------------------------------------------

  /**
   * Form stage — mark as in_progress, wait for candidate submission.
   */
  private async executeFormStage(
    stage: PipelineStage,
    assignment: PipelineAssignment,
    _ctx: PipelineContext
  ): Promise<StageExecutionResult> {
    console.log(
      `[PipelineRunner] Form stage "${stage.name}" — waiting for candidate submission`
    );

    // Form stages wait for the candidate to submit the form.
    // The stage will be completed when the form submission endpoint
    // calls handleStageCompletion().
    return {
      success: true,
      stageId: stage.id,
      status: 'waiting',
      data: {
        formDefinitionId: stage.formDefinitionId,
        moduleConfig: stage.moduleConfig,
      },
    };
  }

  /**
   * External service stage — fire request, auto-advance on sync success.
   */
  private async executeExternalServiceStage(
    stage: PipelineStage,
    assignment: PipelineAssignment,
    _ctx: PipelineContext
  ): Promise<StageExecutionResult> {
    const config = stage.moduleConfig as unknown as ExternalServiceModuleConfig;

    console.log(
      `[PipelineRunner] External service stage "${stage.name}" — calling provider "${config.provider}"`
    );

    const result = await externalServiceAdapterService.executeExternalService(
      stage.id,
      config,
      { candidateId: assignment.candidateId, assignmentId: assignment.id }
    );

    if (!result.success) {
      return {
        success: false,
        stageId: stage.id,
        status: 'failed',
        error: result.error ?? 'External service call failed',
      };
    }

    // If the service has a webhookUrl, we wait for the callback
    if (config.webhookUrl) {
      console.log(
        `[PipelineRunner] Waiting for webhook callback for stage "${stage.name}"`
      );
      return {
        success: true,
        stageId: stage.id,
        status: 'waiting',
        data: { requestId: result.data },
      };
    }

    // Synchronous response — auto-complete
    return {
      success: true,
      stageId: stage.id,
      status: 'completed',
      data: { response: result.data },
    };
  }

  /**
   * Internal processing stage — simulate processing, auto-advance.
   */
  private async executeInternalProcessingStage(
    stage: PipelineStage,
    _assignment: PipelineAssignment,
    _ctx: PipelineContext
  ): Promise<StageExecutionResult> {
    console.log(
      `[PipelineRunner] Internal processing stage "${stage.name}" — running processor`
    );

    const config = stage.moduleConfig as { processor?: string; timeout?: number };

    // Stub: simulate processing delay (100ms)
    await new Promise((resolve) => setTimeout(resolve, 100));

    console.log(
      `[PipelineRunner] Internal processing "${config.processor ?? 'default'}" completed`
    );

    return {
      success: true,
      stageId: stage.id,
      status: 'completed',
      data: {
        processor: config.processor ?? 'default',
        processedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Human review stage — create a review task, wait for decision.
   */
  private async executeHumanReviewStage(
    stage: PipelineStage,
    assignment: PipelineAssignment,
    pipeline: ScreeningPipeline,
    ctx: PipelineContext
  ): Promise<StageExecutionResult> {
    const config = stage.moduleConfig as unknown as HumanReviewModuleConfig;

    console.log(
      `[PipelineRunner] Human review stage "${stage.name}" — creating review task for role "${config.assigneeRole}"`
    );

    const createResult = await reviewTaskService.createReviewTask(
      {
        pipelineId: pipeline.id,
        assignmentId: assignment.id,
        stageId: stage.id,
        candidateId: assignment.candidateId,
        assigneeRole: config.assigneeRole,
        reviewFormId: config.reviewFormId,
        decisionOptions: config.decisionOptions,
        timeoutHours: config.timeoutHours,
        escalationPolicy: config.escalationPolicy,
      },
      ctx
    );

    if (!createResult.success) {
      return {
        success: false,
        stageId: stage.id,
        status: 'failed',
        error: createResult.error ?? 'Failed to create review task',
      };
    }

    return {
      success: true,
      stageId: stage.id,
      status: 'waiting',
      data: { reviewTaskId: createResult.data?.id },
    };
  }

  /**
   * Notification stage — dispatch notification, auto-advance.
   */
  private async executeNotificationStage(
    stage: PipelineStage,
    assignment: PipelineAssignment,
    pipeline: ScreeningPipeline,
    ctx: PipelineContext
  ): Promise<StageExecutionResult> {
    const config = stage.moduleConfig as unknown as NotificationModuleConfig;

    console.log(
      `[PipelineRunner] Notification stage "${stage.name}" — dispatching ${config.channel} notification`
    );

    const dispatchResult =
      await notificationDispatcherService.dispatchNotification(config, {
        tenantId: ctx.tenantId,
        pipelineId: pipeline.id,
        assignmentId: assignment.id,
        stageId: stage.id,
        candidateId: assignment.candidateId,
        pipelineName: pipeline.name,
        stageName: stage.name,
      });

    if (!dispatchResult.success) {
      // Notification failures are non-blocking — log but continue
      console.error(
        `[PipelineRunner] Notification dispatch failed for stage "${stage.name}":`,
        dispatchResult.error
      );
    }

    // Notification stages are always auto-completed (non-blocking)
    return {
      success: true,
      stageId: stage.id,
      status: 'completed',
      data: { notificationSent: dispatchResult.success },
    };
  }

  // -----------------------------------------------------------------------
  // Private: Graph Traversal Helpers
  // -----------------------------------------------------------------------

  /**
   * Get the first stage to execute.
   * Uses graph root node if available, otherwise first by order.
   */
  private getFirstStage(pipeline: ScreeningPipeline): PipelineStage | null {
    if (pipeline.stages.length === 0) return null;

    if (pipeline.graph?.nodes?.length && pipeline.graph?.edges?.length) {
      // Find root node (no incoming edges)
      const targetIds = new Set(pipeline.graph.edges.map((e) => e.target));
      const rootNode = pipeline.graph.nodes.find(
        (n) => !targetIds.has(n.id)
      );

      if (rootNode) {
        const stageId = rootNode.data.stageId;
        const stage = pipeline.stages.find((s) => s.id === stageId);
        if (stage) return stage;
      }
    }

    // Fallback: first by order
    const sorted = [...pipeline.stages].sort((a, b) => a.order - b.order);
    return sorted[0] ?? null;
  }

  /**
   * Determine the next stage after completion of the given stage.
   * Prefers graph edges; falls back to stage order.
   */
  private getNextStage(
    pipeline: ScreeningPipeline,
    completedStageId: string
  ): PipelineStage | null {
    // Try graph traversal first
    if (pipeline.graph?.nodes?.length && pipeline.graph?.edges?.length) {
      const nextStage = this.getNextStageFromGraph(
        pipeline,
        completedStageId
      );
      if (nextStage) return nextStage;
    }

    // Fallback: next by order
    const sorted = [...pipeline.stages].sort((a, b) => a.order - b.order);
    const currentIndex = sorted.findIndex((s) => s.id === completedStageId);

    if (currentIndex >= 0 && currentIndex < sorted.length - 1) {
      return sorted[currentIndex + 1] ?? null;
    }

    return null;
  }

  /**
   * Traverse the pipeline graph to find the next stage.
   * If multiple outgoing edges exist (branching), takes the first one.
   */
  private getNextStageFromGraph(
    pipeline: ScreeningPipeline,
    completedStageId: string
  ): PipelineStage | null {
    if (!pipeline.graph) return null;

    // Find the node for the completed stage
    const completedNode = pipeline.graph.nodes.find(
      (n) => n.data.stageId === completedStageId
    );
    if (!completedNode) return null;

    // Find outgoing edges from this node
    const outgoingEdges = pipeline.graph.edges.filter(
      (e) => e.source === completedNode.id
    );
    if (outgoingEdges.length === 0) return null;

    // Take the first outgoing edge (branching logic is future work)
    const nextNodeId = outgoingEdges[0]!.target;
    const nextNode = pipeline.graph.nodes.find((n) => n.id === nextNodeId);
    if (!nextNode) return null;

    // Find the corresponding stage
    return (
      pipeline.stages.find((s) => s.id === nextNode.data.stageId) ?? null
    );
  }
}

export const pipelineRunnerService = new PipelineRunnerService();
