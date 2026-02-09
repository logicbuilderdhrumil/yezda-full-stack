/**
 * Pipeline Lifecycle Use Cases (Activate, Archive, Delete)
 */
import type { IScreeningPipelineRepository } from '../../domain/ports/screening-pipeline-repository.port.js';
import type { IAuditService } from '../../domain/ports/audit-service.port.js';
import type { IMetricsService } from '../../domain/ports/metrics-service.port.js';
import type { ScreeningPipeline, PipelineOperationResult, PipelineContext } from '../../domain/entities/screening-pipeline.entity.js';
import { canManagePipelines } from '../../domain/services/pipeline-authorization.service.js';

export class ActivatePipelineUseCase {
  constructor(private readonly repo: IScreeningPipelineRepository, private readonly audit: IAuditService, private readonly metrics: IMetricsService) {}

  async execute(id: string, ctx: PipelineContext): Promise<PipelineOperationResult<ScreeningPipeline>> {
    if (!canManagePipelines(ctx.actorRoles)) return { success: false, error: 'Insufficient permissions', errorCode: 'FORBIDDEN' };
    const existing = await this.repo.findByIdAndTenant(id, ctx.tenantId);
    if (!existing) return { success: false, error: 'Pipeline not found', errorCode: 'NOT_FOUND' };
    if (existing.status === 'active') return { success: false, error: 'Pipeline is already active', errorCode: 'ALREADY_ACTIVE' };
    if (existing.status === 'archived') return { success: false, error: 'Cannot activate an archived pipeline', errorCode: 'ARCHIVED' };
    if (existing.stages.length === 0) return { success: false, error: 'Pipeline must have at least one stage', errorCode: 'NO_STAGES' };

    const updated = await this.repo.updateStatus(id, 'active');
    if (!updated) return { success: false, error: 'Failed to activate pipeline', errorCode: 'INTERNAL_ERROR' };

    this.audit.log({ eventType: 'PIPELINE_ACTIVATED', actorId: ctx.actorId, actorType: ctx.actorType, targetId: id, targetType: 'pipeline', channel: ctx.channel, metadata: { operation: 'pipeline_activate', tenantId: ctx.tenantId, previousStatus: existing.status }, success: true });
    this.metrics.incrementCounter('screening_pipeline_success', { operation: 'activate' });
    return { success: true, data: updated };
  }
}

export class ArchivePipelineUseCase {
  constructor(private readonly repo: IScreeningPipelineRepository, private readonly audit: IAuditService, private readonly metrics: IMetricsService) {}

  async execute(id: string, ctx: PipelineContext): Promise<PipelineOperationResult<ScreeningPipeline>> {
    if (!canManagePipelines(ctx.actorRoles)) return { success: false, error: 'Insufficient permissions', errorCode: 'FORBIDDEN' };
    const existing = await this.repo.findByIdAndTenant(id, ctx.tenantId);
    if (!existing) return { success: false, error: 'Pipeline not found', errorCode: 'NOT_FOUND' };
    if (existing.status === 'archived') return { success: false, error: 'Pipeline is already archived', errorCode: 'ALREADY_ARCHIVED' };

    const updated = await this.repo.updateStatus(id, 'archived');
    if (!updated) return { success: false, error: 'Failed to archive pipeline', errorCode: 'INTERNAL_ERROR' };

    this.audit.log({ eventType: 'PIPELINE_ARCHIVED', actorId: ctx.actorId, actorType: ctx.actorType, targetId: id, targetType: 'pipeline', channel: ctx.channel, metadata: { operation: 'pipeline_archive', tenantId: ctx.tenantId, previousStatus: existing.status }, success: true });
    this.metrics.incrementCounter('screening_pipeline_success', { operation: 'archive' });
    return { success: true, data: updated };
  }
}

export class DeletePipelineUseCase {
  constructor(private readonly repo: IScreeningPipelineRepository, private readonly audit: IAuditService, private readonly metrics: IMetricsService) {}

  async execute(id: string, ctx: PipelineContext): Promise<PipelineOperationResult<void>> {
    if (!canManagePipelines(ctx.actorRoles)) return { success: false, error: 'Insufficient permissions', errorCode: 'FORBIDDEN' };
    const existing = await this.repo.findByIdAndTenant(id, ctx.tenantId);
    if (!existing) return { success: false, error: 'Pipeline not found', errorCode: 'NOT_FOUND' };
    if (existing.status !== 'draft') return { success: false, error: 'Only draft pipelines can be deleted', errorCode: 'NOT_DELETABLE' };

    const assignmentCount = await this.repo.countAssignmentsByPipeline(id);
    if (assignmentCount > 0) return { success: false, error: 'Cannot delete a pipeline with existing assignments', errorCode: 'HAS_ASSIGNMENTS' };

    const deleted = await this.repo.delete(id);
    if (!deleted) return { success: false, error: 'Failed to delete pipeline', errorCode: 'INTERNAL_ERROR' };

    this.audit.log({ eventType: 'PIPELINE_DELETED', actorId: ctx.actorId, actorType: ctx.actorType, targetId: id, targetType: 'pipeline', channel: ctx.channel, metadata: { operation: 'pipeline_delete', tenantId: ctx.tenantId, deletedPipelineName: existing.name }, success: true });
    this.metrics.incrementCounter('screening_pipeline_success', { operation: 'delete' });
    return { success: true };
  }
}
