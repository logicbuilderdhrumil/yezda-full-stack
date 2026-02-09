/**
 * Pipeline Assignment Use Cases
 */
import { v4 as uuidv4 } from 'uuid';
import type { IScreeningPipelineRepository } from '../../domain/ports/screening-pipeline-repository.port.js';
import type { IAuditService } from '../../domain/ports/audit-service.port.js';
import type { IMetricsService } from '../../domain/ports/metrics-service.port.js';
import type {
  PipelineAssignment,
  PipelineOperationResult,
  PipelineContext,
  AssignmentProgress,
  StageStatus,
} from '../../domain/entities/screening-pipeline.entity.js';
import { canAssignPipelines, canViewPipelines } from '../../domain/services/pipeline-authorization.service.js';

export class AssignPipelineUseCase {
  constructor(private readonly repo: IScreeningPipelineRepository, private readonly audit: IAuditService, private readonly metrics: IMetricsService) {}

  async execute(pipelineId: string, candidateId: string, ctx: PipelineContext): Promise<PipelineOperationResult<PipelineAssignment>> {
    const startTime = Date.now();
    if (!canAssignPipelines(ctx.actorRoles)) return { success: false, error: 'Insufficient permissions', errorCode: 'FORBIDDEN' };

    try {
      const pipeline = await this.repo.findByIdAndTenant(pipelineId, ctx.tenantId);
      if (!pipeline) return { success: false, error: 'Pipeline not found', errorCode: 'NOT_FOUND' };
      if (pipeline.status !== 'active') return { success: false, error: 'Only active pipelines can be assigned', errorCode: 'NOT_ACTIVE' };

      const alreadyAssigned = await this.repo.assignmentExists(candidateId, pipelineId);
      if (alreadyAssigned) return { success: false, error: 'Candidate is already assigned to this pipeline', errorCode: 'ALREADY_ASSIGNED' };

      const now = new Date();
      const assignmentId = uuidv4();
      const stageStatuses: Record<string, StageStatus> = {};
      pipeline.stages.forEach((stage, index) => { stageStatuses[stage.id] = index === 0 ? 'in_progress' : 'pending'; });

      const assignment: PipelineAssignment = { id: assignmentId, tenantId: ctx.tenantId, pipelineId, candidateId, currentStageOrder: 0, status: 'in_progress', stageStatuses, progressPercentage: 0, assignedBy: ctx.actorId, assignedAt: now, createdAt: now, updatedAt: now };
      const created = await this.repo.createAssignment(assignment);

      this.audit.log({ eventType: 'PIPELINE_ASSIGNED', actorId: ctx.actorId, actorType: ctx.actorType, targetId: assignmentId, targetType: 'pipeline_assignment', channel: ctx.channel, metadata: { operation: 'pipeline_assign', tenantId: ctx.tenantId, pipelineId, candidateId, stageCount: pipeline.stages.length }, success: true });
      this.metrics.incrementCounter('screening_pipeline_success', { operation: 'assign' });
      this.metrics.recordLatency('screening_pipeline_request_latency', Date.now() - startTime, { operation: 'assign' });

      return { success: true, data: created };
    } catch (error) {
      console.error('[ScreeningPipeline] Assign pipeline error:', error);
      this.metrics.incrementCounter('screening_pipeline_error', { operation: 'assign' });
      return { success: false, error: 'Failed to assign pipeline', errorCode: 'INTERNAL_ERROR' };
    }
  }
}

export class CompleteStageUseCase {
  constructor(private readonly repo: IScreeningPipelineRepository, private readonly audit: IAuditService, private readonly metrics: IMetricsService) {}

  async execute(assignmentId: string, stageId: string, ctx: PipelineContext): Promise<PipelineOperationResult<PipelineAssignment>> {
    if (!canAssignPipelines(ctx.actorRoles)) return { success: false, error: 'Insufficient permissions', errorCode: 'FORBIDDEN' };

    try {
      const assignment = await this.repo.findAssignmentByIdAndTenant(assignmentId, ctx.tenantId);
      if (!assignment) return { success: false, error: 'Assignment not found', errorCode: 'NOT_FOUND' };
      if (assignment.status !== 'in_progress') return { success: false, error: 'Assignment is not in progress', errorCode: 'NOT_IN_PROGRESS' };

      const pipeline = await this.repo.findById(assignment.pipelineId);
      if (!pipeline) return { success: false, error: 'Pipeline not found', errorCode: 'PIPELINE_NOT_FOUND' };

      const stage = pipeline.stages.find((s) => s.id === stageId);
      if (!stage) return { success: false, error: 'Stage not found', errorCode: 'STAGE_NOT_FOUND' };
      if (assignment.stageStatuses[stageId] !== 'in_progress') return { success: false, error: 'Stage is not in progress', errorCode: 'STAGE_NOT_IN_PROGRESS' };

      const updatedStatuses = { ...assignment.stageStatuses };
      updatedStatuses[stageId] = 'completed';

      const idx = pipeline.stages.findIndex((s) => s.id === stageId);
      let nextOrder = assignment.currentStageOrder;
      if (idx < pipeline.stages.length - 1) {
        const next = pipeline.stages[idx + 1];
        updatedStatuses[next.id] = 'in_progress';
        nextOrder = next.order;
      }

      const completedCount = Object.values(updatedStatuses).filter((s) => s === 'completed' || s === 'skipped').length;
      const progress = Math.round((completedCount / pipeline.stages.length) * 100);
      const allDone = completedCount === pipeline.stages.length;

      const updated = await this.repo.updateAssignment(assignmentId, { stageStatuses: updatedStatuses, currentStageOrder: nextOrder, progressPercentage: progress, status: allDone ? 'completed' : 'in_progress', completedAt: allDone ? new Date() : undefined });
      if (!updated) return { success: false, error: 'Failed to complete stage', errorCode: 'INTERNAL_ERROR' };

      this.audit.log({ eventType: 'PIPELINE_STAGE_COMPLETED', actorId: ctx.actorId, actorType: ctx.actorType, targetId: assignmentId, targetType: 'pipeline_assignment', channel: ctx.channel, metadata: { operation: 'pipeline_stage_complete', stageId, stageName: stage.name, pipelineId: pipeline.id, progressPercentage: progress, allCompleted: allDone }, success: true });
      this.metrics.incrementCounter('screening_pipeline_success', { operation: 'complete_stage' });
      return { success: true, data: updated };
    } catch (error) {
      console.error('[ScreeningPipeline] Complete stage error:', error);
      return { success: false, error: 'Failed to complete stage', errorCode: 'INTERNAL_ERROR' };
    }
  }
}

export class GetAssignmentProgressUseCase {
  constructor(private readonly repo: IScreeningPipelineRepository, private readonly metrics: IMetricsService) {}

  async execute(assignmentId: string, ctx: PipelineContext): Promise<PipelineOperationResult<AssignmentProgress>> {
    if (!canViewPipelines(ctx.actorRoles)) return { success: false, error: 'Insufficient permissions', errorCode: 'FORBIDDEN' };

    try {
      const assignment = await this.repo.findAssignmentByIdAndTenant(assignmentId, ctx.tenantId);
      if (!assignment) return { success: false, error: 'Assignment not found', errorCode: 'NOT_FOUND' };
      const pipeline = await this.repo.findById(assignment.pipelineId);
      if (!pipeline) return { success: false, error: 'Pipeline not found', errorCode: 'PIPELINE_NOT_FOUND' };

      const currentStage = pipeline.stages.find((s) => assignment.stageStatuses[s.id] === 'in_progress') || null;
      const completedStages = Object.values(assignment.stageStatuses).filter((s) => s === 'completed' || s === 'skipped').length;

      return { success: true, data: { assignment, pipeline, currentStage, completedStages, totalStages: pipeline.stages.length, progressPercentage: assignment.progressPercentage } };
    } catch (error) {
      console.error('[ScreeningPipeline] Get progress error:', error);
      return { success: false, error: 'Failed to get progress', errorCode: 'INTERNAL_ERROR' };
    }
  }
}

export class GetCandidateAssignmentsUseCase {
  constructor(private readonly repo: IScreeningPipelineRepository, private readonly metrics: IMetricsService) {}

  async execute(candidateId: string, ctx: PipelineContext): Promise<PipelineOperationResult<PipelineAssignment[]>> {
    if (!canViewPipelines(ctx.actorRoles)) return { success: false, error: 'Insufficient permissions', errorCode: 'FORBIDDEN' };

    try {
      const assignments = await this.repo.findAssignmentsByCandidateAndTenant(candidateId, ctx.tenantId);
      return { success: true, data: assignments };
    } catch (error) {
      console.error('[ScreeningPipeline] Get assignments error:', error);
      return { success: false, error: 'Failed to get assignments', errorCode: 'INTERNAL_ERROR' };
    }
  }
}
