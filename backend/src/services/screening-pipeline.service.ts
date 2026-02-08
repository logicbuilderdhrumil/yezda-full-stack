/**
 * Screening Pipeline Service
 * Business logic for screening pipeline operations.
 * Enforces RBAC and tenant isolation at the service layer.
 */

import { v4 as uuidv4 } from 'uuid';
import { screeningPipelineRepository } from '../repositories/screening-pipeline.repository.js';
import { auditService } from './audit.service.js';
import { metricsService } from './metrics.service.js';
import { moduleRegistry } from './module-registry.service.js';
import type {
  ScreeningPipeline,
  PipelineStage,
  PipelineAssignment,
  CreatePipelineDto,
  UpdatePipelineDto,
  PipelineOperationResult,
  PipelineContext,
  AssignmentProgress,
  StageStatus,
  ModuleType,
} from '../models/screening-pipeline.model.js';

/**
 * Check if actor has permission to manage pipelines
 */
function canManagePipelines(roles: string[]): boolean {
  return roles.includes('admin') || roles.includes('manager');
}

/**
 * Check if actor has permission to view pipelines
 */
function canViewPipelines(roles: string[]): boolean {
  return roles.includes('admin') || roles.includes('manager') || roles.includes('agent');
}

/**
 * Check if actor has permission to assign pipelines
 */
function canAssignPipelines(roles: string[]): boolean {
  return roles.includes('admin') || roles.includes('manager') || roles.includes('agent');
}

export class ScreeningPipelineService {
  /**
   * List all pipelines for a tenant
   */
  async listPipelines(
    ctx: PipelineContext
  ): Promise<PipelineOperationResult<ScreeningPipeline[]>> {
    const startTime = Date.now();

    if (!canViewPipelines(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'list', 'Insufficient permissions');
      metricsService.incrementCounter('screening_pipeline_access_denied', { operation: 'list' });
      return {
        success: false,
        error: 'Insufficient permissions to list pipelines',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      const pipelines = await screeningPipelineRepository.findAll(ctx.tenantId);

      auditService.log({
        eventType: 'GUARD_ACCESS_GRANTED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'pipeline_list',
          tenantId: ctx.tenantId,
          resultCount: pipelines.length,
        },
        success: true,
      });

      metricsService.recordLatency('screening_pipeline_request_latency', Date.now() - startTime, {
        operation: 'list',
      });

      return { success: true, data: pipelines };
    } catch (error) {
      console.error('[ScreeningPipeline] List pipelines error:', error);
      metricsService.incrementCounter('screening_pipeline_error', { operation: 'list' });
      return {
        success: false,
        error: 'Failed to list pipelines',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Get pipeline by ID
   */
  async getPipeline(
    id: string,
    ctx: PipelineContext
  ): Promise<PipelineOperationResult<ScreeningPipeline>> {
    const startTime = Date.now();

    if (!canViewPipelines(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'view', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to view pipeline',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      const pipeline = await screeningPipelineRepository.findByIdAndTenant(id, ctx.tenantId);

      if (!pipeline) {
        return {
          success: false,
          error: 'Pipeline not found',
          errorCode: 'NOT_FOUND',
        };
      }

      auditService.log({
        eventType: 'GUARD_ACCESS_GRANTED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: id,
        targetType: 'pipeline',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'pipeline_view',
          tenantId: ctx.tenantId,
        },
        success: true,
      });

      metricsService.recordLatency('screening_pipeline_request_latency', Date.now() - startTime, {
        operation: 'view',
      });

      return { success: true, data: pipeline };
    } catch (error) {
      console.error('[ScreeningPipeline] Get pipeline error:', error);
      return {
        success: false,
        error: 'Failed to get pipeline',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Create a new pipeline
   */
  async createPipeline(
    dto: CreatePipelineDto,
    ctx: PipelineContext
  ): Promise<PipelineOperationResult<ScreeningPipeline>> {
    const startTime = Date.now();

    if (!canManagePipelines(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'create', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to create pipelines',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      // Check for duplicate name
      const nameExists = await screeningPipelineRepository.nameExists(dto.name, ctx.tenantId);
      if (nameExists) {
        return {
          success: false,
          error: 'A pipeline with this name already exists',
          errorCode: 'NAME_EXISTS',
        };
      }

      const now = new Date();
      const pipelineId = uuidv4();

      // Validate module configs via registry
      for (const stageInput of dto.stages) {
        const moduleType = (stageInput as { moduleType?: ModuleType }).moduleType || 'form';
        const moduleConfig = (stageInput as { moduleConfig?: Record<string, unknown> }).moduleConfig;
        if (moduleConfig && moduleRegistry.has(moduleType)) {
          const validationError = moduleRegistry.validate(moduleType, moduleConfig);
          if (validationError) {
            return {
              success: false,
              error: validationError,
              errorCode: 'INVALID_MODULE_CONFIG',
            };
          }
        }
      }

      // Create stages with proper IDs
      const stages: PipelineStage[] = dto.stages.map((stageInput) => ({
        id: uuidv4(),
        pipelineId,
        formDefinitionId: stageInput.formDefinitionId,
        name: stageInput.name,
        description: stageInput.description,
        order: stageInput.order,
        isRequired: stageInput.isRequired ?? true,
        estimatedDurationMinutes: stageInput.estimatedDurationMinutes,
        moduleType: ((stageInput as { moduleType?: ModuleType }).moduleType || 'form') as ModuleType,
        moduleConfig: (stageInput as { moduleConfig?: Record<string, unknown> }).moduleConfig,
        createdAt: now,
        updatedAt: now,
      }));

      // Sort stages by order
      stages.sort((a, b) => a.order - b.order);

      const pipeline: ScreeningPipeline = {
        id: pipelineId,
        tenantId: ctx.tenantId,
        name: dto.name,
        description: dto.description,
        stages,
        status: 'draft',
        version: 1,
        graph: (dto as { graph?: ScreeningPipeline['graph'] }).graph,
        createdBy: ctx.actorId,
        createdAt: now,
        updatedAt: now,
      };

      const created = await screeningPipelineRepository.create(pipeline);

      auditService.log({
        eventType: 'AUTH_SIGN_UP', // Using existing event type
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: pipelineId,
        targetType: 'pipeline',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'pipeline_create',
          tenantId: ctx.tenantId,
          name: dto.name,
          stageCount: stages.length,
        },
        success: true,
      });

      metricsService.incrementCounter('screening_pipeline_success', { operation: 'create' });
      metricsService.recordLatency('screening_pipeline_request_latency', Date.now() - startTime, {
        operation: 'create',
      });

      return { success: true, data: created };
    } catch (error) {
      console.error('[ScreeningPipeline] Create pipeline error:', error);
      metricsService.incrementCounter('screening_pipeline_error', { operation: 'create' });
      return {
        success: false,
        error: 'Failed to create pipeline',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Update a pipeline (only allowed for draft status)
   */
  async updatePipeline(
    id: string,
    dto: UpdatePipelineDto,
    ctx: PipelineContext
  ): Promise<PipelineOperationResult<ScreeningPipeline>> {
    const startTime = Date.now();

    if (!canManagePipelines(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'update', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to update pipelines',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      const existing = await screeningPipelineRepository.findByIdAndTenant(id, ctx.tenantId);

      if (!existing) {
        return {
          success: false,
          error: 'Pipeline not found',
          errorCode: 'NOT_FOUND',
        };
      }

      // Only draft pipelines can be updated
      if (existing.status !== 'draft') {
        return {
          success: false,
          error: 'Only draft pipelines can be updated',
          errorCode: 'NOT_EDITABLE',
        };
      }

      // Check for duplicate name if name is being changed
      if (dto.name && dto.name !== existing.name) {
        const nameExists = await screeningPipelineRepository.nameExists(dto.name, ctx.tenantId, id);
        if (nameExists) {
          return {
            success: false,
            error: 'A pipeline with this name already exists',
            errorCode: 'NAME_EXISTS',
          };
        }
      }

      const now = new Date();
      const updateData: Partial<ScreeningPipeline> = {
        updatedAt: now,
      };

      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.description !== undefined) updateData.description = dto.description;

      // If stages are being updated, recreate them
      if (dto.stages) {
        // Validate module configs via registry
        for (const stageInput of dto.stages) {
          const moduleType = (stageInput as { moduleType?: ModuleType }).moduleType || 'form';
          const moduleConfig = (stageInput as { moduleConfig?: Record<string, unknown> }).moduleConfig;
          if (moduleConfig && moduleRegistry.has(moduleType)) {
            const validationError = moduleRegistry.validate(moduleType, moduleConfig);
            if (validationError) {
              return {
                success: false,
                error: validationError,
                errorCode: 'INVALID_MODULE_CONFIG',
              };
            }
          }
        }

        const stages: PipelineStage[] = dto.stages.map((stageInput) => ({
          id: uuidv4(),
          pipelineId: id,
          formDefinitionId: stageInput.formDefinitionId,
          name: stageInput.name,
          description: stageInput.description,
          order: stageInput.order,
          isRequired: stageInput.isRequired ?? true,
          estimatedDurationMinutes: stageInput.estimatedDurationMinutes,
          moduleType: ((stageInput as { moduleType?: ModuleType }).moduleType || 'form') as ModuleType,
          moduleConfig: (stageInput as { moduleConfig?: Record<string, unknown> }).moduleConfig,
          createdAt: now,
          updatedAt: now,
        }));
        stages.sort((a, b) => a.order - b.order);
        updateData.stages = stages;
      }

      // Store graph data if provided
      const graph = (dto as { graph?: ScreeningPipeline['graph'] }).graph;
      if (graph !== undefined) {
        updateData.graph = graph;
      }

      const updated = await screeningPipelineRepository.update(id, updateData);

      if (!updated) {
        return {
          success: false,
          error: 'Failed to update pipeline',
          errorCode: 'INTERNAL_ERROR',
        };
      }

      auditService.log({
        eventType: 'SHELL_PREFERENCE_UPDATED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: id,
        targetType: 'pipeline',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'pipeline_update',
          tenantId: ctx.tenantId,
          changes: dto,
        },
        success: true,
      });

      metricsService.incrementCounter('screening_pipeline_success', { operation: 'update' });
      metricsService.recordLatency('screening_pipeline_request_latency', Date.now() - startTime, {
        operation: 'update',
      });

      return { success: true, data: updated };
    } catch (error) {
      console.error('[ScreeningPipeline] Update pipeline error:', error);
      metricsService.incrementCounter('screening_pipeline_error', { operation: 'update' });
      return {
        success: false,
        error: 'Failed to update pipeline',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Activate a pipeline (must have at least 1 stage)
   */
  async activatePipeline(
    id: string,
    ctx: PipelineContext
  ): Promise<PipelineOperationResult<ScreeningPipeline>> {
    const startTime = Date.now();

    if (!canManagePipelines(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'activate', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to activate pipelines',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      const existing = await screeningPipelineRepository.findByIdAndTenant(id, ctx.tenantId);

      if (!existing) {
        return {
          success: false,
          error: 'Pipeline not found',
          errorCode: 'NOT_FOUND',
        };
      }

      if (existing.status === 'active') {
        return {
          success: false,
          error: 'Pipeline is already active',
          errorCode: 'ALREADY_ACTIVE',
        };
      }

      if (existing.status === 'archived') {
        return {
          success: false,
          error: 'Cannot activate an archived pipeline',
          errorCode: 'ARCHIVED',
        };
      }

      if (existing.stages.length === 0) {
        return {
          success: false,
          error: 'Pipeline must have at least one stage to be activated',
          errorCode: 'NO_STAGES',
        };
      }

      const updated = await screeningPipelineRepository.updateStatus(id, 'active');

      if (!updated) {
        return {
          success: false,
          error: 'Failed to activate pipeline',
          errorCode: 'INTERNAL_ERROR',
        };
      }

      auditService.log({
        eventType: 'SHELL_PREFERENCE_UPDATED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: id,
        targetType: 'pipeline',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'pipeline_activate',
          tenantId: ctx.tenantId,
          previousStatus: existing.status,
        },
        success: true,
      });

      metricsService.incrementCounter('screening_pipeline_success', { operation: 'activate' });
      metricsService.recordLatency('screening_pipeline_request_latency', Date.now() - startTime, {
        operation: 'activate',
      });

      return { success: true, data: updated };
    } catch (error) {
      console.error('[ScreeningPipeline] Activate pipeline error:', error);
      metricsService.incrementCounter('screening_pipeline_error', { operation: 'activate' });
      return {
        success: false,
        error: 'Failed to activate pipeline',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Archive a pipeline
   */
  async archivePipeline(
    id: string,
    ctx: PipelineContext
  ): Promise<PipelineOperationResult<ScreeningPipeline>> {
    const startTime = Date.now();

    if (!canManagePipelines(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'archive', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to archive pipelines',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      const existing = await screeningPipelineRepository.findByIdAndTenant(id, ctx.tenantId);

      if (!existing) {
        return {
          success: false,
          error: 'Pipeline not found',
          errorCode: 'NOT_FOUND',
        };
      }

      if (existing.status === 'archived') {
        return {
          success: false,
          error: 'Pipeline is already archived',
          errorCode: 'ALREADY_ARCHIVED',
        };
      }

      const updated = await screeningPipelineRepository.updateStatus(id, 'archived');

      if (!updated) {
        return {
          success: false,
          error: 'Failed to archive pipeline',
          errorCode: 'INTERNAL_ERROR',
        };
      }

      auditService.log({
        eventType: 'SHELL_PREFERENCE_UPDATED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: id,
        targetType: 'pipeline',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'pipeline_archive',
          tenantId: ctx.tenantId,
          previousStatus: existing.status,
        },
        success: true,
      });

      metricsService.incrementCounter('screening_pipeline_success', { operation: 'archive' });
      metricsService.recordLatency('screening_pipeline_request_latency', Date.now() - startTime, {
        operation: 'archive',
      });

      return { success: true, data: updated };
    } catch (error) {
      console.error('[ScreeningPipeline] Archive pipeline error:', error);
      metricsService.incrementCounter('screening_pipeline_error', { operation: 'archive' });
      return {
        success: false,
        error: 'Failed to archive pipeline',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Delete a pipeline (only draft allowed)
   */
  async deletePipeline(
    id: string,
    ctx: PipelineContext
  ): Promise<PipelineOperationResult<void>> {
    const startTime = Date.now();

    if (!canManagePipelines(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'delete', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to delete pipelines',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      const existing = await screeningPipelineRepository.findByIdAndTenant(id, ctx.tenantId);

      if (!existing) {
        return {
          success: false,
          error: 'Pipeline not found',
          errorCode: 'NOT_FOUND',
        };
      }

      if (existing.status !== 'draft') {
        return {
          success: false,
          error: 'Only draft pipelines can be deleted',
          errorCode: 'NOT_DELETABLE',
        };
      }

      // Check for existing assignments
      const assignmentCount = await screeningPipelineRepository.countAssignmentsByPipeline(id);
      if (assignmentCount > 0) {
        return {
          success: false,
          error: 'Cannot delete a pipeline with existing assignments',
          errorCode: 'HAS_ASSIGNMENTS',
        };
      }

      const deleted = await screeningPipelineRepository.delete(id);

      if (!deleted) {
        return {
          success: false,
          error: 'Failed to delete pipeline',
          errorCode: 'INTERNAL_ERROR',
        };
      }

      auditService.log({
        eventType: 'SHELL_PREFERENCE_UPDATED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: id,
        targetType: 'pipeline',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'pipeline_delete',
          tenantId: ctx.tenantId,
          deletedPipelineName: existing.name,
        },
        success: true,
      });

      metricsService.incrementCounter('screening_pipeline_success', { operation: 'delete' });
      metricsService.recordLatency('screening_pipeline_request_latency', Date.now() - startTime, {
        operation: 'delete',
      });

      return { success: true };
    } catch (error) {
      console.error('[ScreeningPipeline] Delete pipeline error:', error);
      metricsService.incrementCounter('screening_pipeline_error', { operation: 'delete' });
      return {
        success: false,
        error: 'Failed to delete pipeline',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Assign a pipeline to a candidate
   * Creates PipelineAssignment and initializes stage statuses
   */
  async assignPipeline(
    pipelineId: string,
    candidateId: string,
    ctx: PipelineContext
  ): Promise<PipelineOperationResult<PipelineAssignment>> {
    const startTime = Date.now();

    if (!canAssignPipelines(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'assign', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to assign pipelines',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      const pipeline = await screeningPipelineRepository.findByIdAndTenant(pipelineId, ctx.tenantId);

      if (!pipeline) {
        return {
          success: false,
          error: 'Pipeline not found',
          errorCode: 'NOT_FOUND',
        };
      }

      if (pipeline.status !== 'active') {
        return {
          success: false,
          error: 'Only active pipelines can be assigned',
          errorCode: 'NOT_ACTIVE',
        };
      }

      // Check if already assigned
      const alreadyAssigned = await screeningPipelineRepository.assignmentExists(
        candidateId,
        pipelineId
      );
      if (alreadyAssigned) {
        return {
          success: false,
          error: 'Candidate is already assigned to this pipeline',
          errorCode: 'ALREADY_ASSIGNED',
        };
      }

      const now = new Date();
      const assignmentId = uuidv4();

      // Initialize stage statuses (first stage is in_progress, rest are pending)
      const stageStatuses: Record<string, StageStatus> = {};
      pipeline.stages.forEach((stage, index) => {
        stageStatuses[stage.id] = index === 0 ? 'in_progress' : 'pending';
      });

      const assignment: PipelineAssignment = {
        id: assignmentId,
        tenantId: ctx.tenantId,
        pipelineId,
        candidateId,
        currentStageOrder: 0,
        status: 'in_progress',
        stageStatuses,
        progressPercentage: 0,
        assignedBy: ctx.actorId,
        assignedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      const created = await screeningPipelineRepository.createAssignment(assignment);

      auditService.log({
        eventType: 'AUTH_SIGN_UP',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: assignmentId,
        targetType: 'pipeline_assignment',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'pipeline_assign',
          tenantId: ctx.tenantId,
          pipelineId,
          pipelineName: pipeline.name,
          candidateId,
          stageCount: pipeline.stages.length,
        },
        success: true,
      });

      metricsService.incrementCounter('screening_pipeline_success', { operation: 'assign' });
      metricsService.recordLatency('screening_pipeline_request_latency', Date.now() - startTime, {
        operation: 'assign',
      });

      return { success: true, data: created };
    } catch (error) {
      console.error('[ScreeningPipeline] Assign pipeline error:', error);
      metricsService.incrementCounter('screening_pipeline_error', { operation: 'assign' });
      return {
        success: false,
        error: 'Failed to assign pipeline',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Complete a stage and unlock the next one
   */
  async completeStage(
    assignmentId: string,
    stageId: string,
    ctx: PipelineContext
  ): Promise<PipelineOperationResult<PipelineAssignment>> {
    const startTime = Date.now();

    if (!canAssignPipelines(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'complete_stage', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to complete stages',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      const assignment = await screeningPipelineRepository.findAssignmentByIdAndTenant(
        assignmentId,
        ctx.tenantId
      );

      if (!assignment) {
        return {
          success: false,
          error: 'Assignment not found',
          errorCode: 'NOT_FOUND',
        };
      }

      if (assignment.status !== 'in_progress') {
        return {
          success: false,
          error: 'Assignment is not in progress',
          errorCode: 'NOT_IN_PROGRESS',
        };
      }

      const pipeline = await screeningPipelineRepository.findById(assignment.pipelineId);
      if (!pipeline) {
        return {
          success: false,
          error: 'Pipeline not found',
          errorCode: 'PIPELINE_NOT_FOUND',
        };
      }

      // Find the stage
      const stage = pipeline.stages.find((s) => s.id === stageId);
      if (!stage) {
        return {
          success: false,
          error: 'Stage not found',
          errorCode: 'STAGE_NOT_FOUND',
        };
      }

      // Verify stage is in_progress
      if (assignment.stageStatuses[stageId] !== 'in_progress') {
        return {
          success: false,
          error: 'Stage is not in progress',
          errorCode: 'STAGE_NOT_IN_PROGRESS',
        };
      }

      // Update stage statuses
      const updatedStageStatuses = { ...assignment.stageStatuses };
      updatedStageStatuses[stageId] = 'completed';

      // Find next stage and set it to in_progress
      const currentStageIndex = pipeline.stages.findIndex((s) => s.id === stageId);
      let nextStageOrder = assignment.currentStageOrder;

      if (currentStageIndex < pipeline.stages.length - 1) {
        const nextStage = pipeline.stages[currentStageIndex + 1];
        updatedStageStatuses[nextStage.id] = 'in_progress';
        nextStageOrder = nextStage.order;
      }

      // Calculate progress
      const completedCount = Object.values(updatedStageStatuses).filter(
        (s) => s === 'completed' || s === 'skipped'
      ).length;
      const progressPercentage = Math.round((completedCount / pipeline.stages.length) * 100);

      // Check if all stages are complete
      const allCompleted = completedCount === pipeline.stages.length;

      const updateData: Partial<PipelineAssignment> = {
        stageStatuses: updatedStageStatuses,
        currentStageOrder: nextStageOrder,
        progressPercentage,
        status: allCompleted ? 'completed' : 'in_progress',
        completedAt: allCompleted ? new Date() : undefined,
      };

      const updated = await screeningPipelineRepository.updateAssignment(assignmentId, updateData);

      if (!updated) {
        return {
          success: false,
          error: 'Failed to complete stage',
          errorCode: 'INTERNAL_ERROR',
        };
      }

      auditService.log({
        eventType: 'SHELL_PREFERENCE_UPDATED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: assignmentId,
        targetType: 'pipeline_assignment',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'pipeline_stage_complete',
          tenantId: ctx.tenantId,
          stageId,
          stageName: stage.name,
          pipelineId: pipeline.id,
          progressPercentage,
          allCompleted,
        },
        success: true,
      });

      metricsService.incrementCounter('screening_pipeline_success', { operation: 'complete_stage' });
      metricsService.recordLatency('screening_pipeline_request_latency', Date.now() - startTime, {
        operation: 'complete_stage',
      });

      return { success: true, data: updated };
    } catch (error) {
      console.error('[ScreeningPipeline] Complete stage error:', error);
      metricsService.incrementCounter('screening_pipeline_error', { operation: 'complete_stage' });
      return {
        success: false,
        error: 'Failed to complete stage',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Get assignment progress details
   */
  async getAssignmentProgress(
    assignmentId: string,
    ctx: PipelineContext
  ): Promise<PipelineOperationResult<AssignmentProgress>> {
    const startTime = Date.now();

    if (!canViewPipelines(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'view_progress', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to view progress',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      const assignment = await screeningPipelineRepository.findAssignmentByIdAndTenant(
        assignmentId,
        ctx.tenantId
      );

      if (!assignment) {
        return {
          success: false,
          error: 'Assignment not found',
          errorCode: 'NOT_FOUND',
        };
      }

      const pipeline = await screeningPipelineRepository.findById(assignment.pipelineId);
      if (!pipeline) {
        return {
          success: false,
          error: 'Pipeline not found',
          errorCode: 'PIPELINE_NOT_FOUND',
        };
      }

      const currentStage =
        pipeline.stages.find(
          (s) => assignment.stageStatuses[s.id] === 'in_progress'
        ) || null;

      const completedStages = Object.values(assignment.stageStatuses).filter(
        (s) => s === 'completed' || s === 'skipped'
      ).length;

      const progress: AssignmentProgress = {
        assignment,
        pipeline,
        currentStage,
        completedStages,
        totalStages: pipeline.stages.length,
        progressPercentage: assignment.progressPercentage,
      };

      metricsService.recordLatency('screening_pipeline_request_latency', Date.now() - startTime, {
        operation: 'view_progress',
      });

      return { success: true, data: progress };
    } catch (error) {
      console.error('[ScreeningPipeline] Get progress error:', error);
      return {
        success: false,
        error: 'Failed to get progress',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Get assignments for a candidate
   */
  async getAssignmentsByCandidate(
    candidateId: string,
    ctx: PipelineContext
  ): Promise<PipelineOperationResult<PipelineAssignment[]>> {
    const startTime = Date.now();

    if (!canViewPipelines(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'list_assignments', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to view assignments',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      const assignments = await screeningPipelineRepository.findAssignmentsByCandidateAndTenant(
        candidateId,
        ctx.tenantId
      );

      metricsService.recordLatency('screening_pipeline_request_latency', Date.now() - startTime, {
        operation: 'list_assignments',
      });

      return { success: true, data: assignments };
    } catch (error) {
      console.error('[ScreeningPipeline] Get assignments error:', error);
      return {
        success: false,
        error: 'Failed to get assignments',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Helper to log access denied events
   */
  private logAccessDenied(ctx: PipelineContext, operation: string, reason: string): void {
    auditService.log({
      eventType: 'GUARD_ROLE_DENIED',
      actorId: ctx.actorId,
      actorType: ctx.actorType,
      channel: ctx.channel,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: {
        operation: `screening_pipeline_${operation}`,
        tenantId: ctx.tenantId,
        reason,
        actorRoles: ctx.actorRoles,
      },
      success: false,
      errorMessage: reason,
    });
  }
}

export const screeningPipelineService = new ScreeningPipelineService();
