/**
 * Update Pipeline Use Case
 */
import { v4 as uuidv4 } from 'uuid';
import type { IScreeningPipelineRepository } from '../../domain/ports/screening-pipeline-repository.port.js';
import type { IAuditService } from '../../domain/ports/audit-service.port.js';
import type { IMetricsService } from '../../domain/ports/metrics-service.port.js';
import type { IModuleRegistryService } from '../../domain/ports/module-registry-service.port.js';
import type {
  ScreeningPipeline,
  PipelineStage,
  UpdatePipelineDto,
  PipelineOperationResult,
  PipelineContext,
  StageInput,
  ModuleType,
} from '../../domain/entities/screening-pipeline.entity.js';
import { canManagePipelines } from '../../domain/services/pipeline-authorization.service.js';

export class UpdatePipelineUseCase {
  constructor(
    private readonly pipelineRepo: IScreeningPipelineRepository,
    private readonly auditService: IAuditService,
    private readonly metricsService: IMetricsService,
    private readonly moduleRegistry: IModuleRegistryService,
  ) {}

  async execute(id: string, dto: UpdatePipelineDto, ctx: PipelineContext): Promise<PipelineOperationResult<ScreeningPipeline>> {
    const startTime = Date.now();

    if (!canManagePipelines(ctx.actorRoles)) {
      this.auditService.log({
        eventType: 'GUARD_ROLE_DENIED', actorId: ctx.actorId, actorType: ctx.actorType, channel: ctx.channel,
        metadata: { operation: 'screening_pipeline_update', tenantId: ctx.tenantId, reason: 'Insufficient permissions' },
        success: false, errorMessage: 'Insufficient permissions',
      });
      return { success: false, error: 'Insufficient permissions to update pipelines', errorCode: 'FORBIDDEN' };
    }

    try {
      const existing = await this.pipelineRepo.findByIdAndTenant(id, ctx.tenantId);
      if (!existing) return { success: false, error: 'Pipeline not found', errorCode: 'NOT_FOUND' };
      if (existing.status !== 'draft') return { success: false, error: 'Only draft pipelines can be updated', errorCode: 'NOT_EDITABLE' };

      if (dto.name && dto.name !== existing.name) {
        const nameExists = await this.pipelineRepo.nameExists(dto.name, ctx.tenantId, id);
        if (nameExists) return { success: false, error: 'A pipeline with this name already exists', errorCode: 'NAME_EXISTS' };
      }

      const now = new Date();
      const updateData: Partial<ScreeningPipeline> = { updatedAt: now };

      if (dto.name !== undefined) updateData.name = dto.name;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.graph !== undefined) updateData.graph = dto.graph;

      if (dto.stages) {
        const configError = this.validateStageModuleConfigs(dto.stages);
        if (configError) return configError as PipelineOperationResult<ScreeningPipeline>;

        const stages: PipelineStage[] = dto.stages.map((si) => {
          const mt: ModuleType = si.moduleType ?? 'form';
          const mc = si.moduleConfig && Object.keys(si.moduleConfig).length > 0 ? si.moduleConfig : mt === 'form' ? { formDefinitionId: si.formDefinitionId } : {};
          return { id: uuidv4(), pipelineId: id, formDefinitionId: si.formDefinitionId, name: si.name, description: si.description, order: si.order, isRequired: si.isRequired ?? true, estimatedDurationMinutes: si.estimatedDurationMinutes, moduleType: mt, moduleConfig: mc as Record<string, unknown>, createdAt: now, updatedAt: now };
        });
        stages.sort((a, b) => a.order - b.order);
        updateData.stages = stages;
      }

      const updated = await this.pipelineRepo.update(id, updateData);
      if (!updated) return { success: false, error: 'Failed to update pipeline', errorCode: 'INTERNAL_ERROR' };

      this.auditService.log({
        eventType: 'PIPELINE_UPDATED', actorId: ctx.actorId, actorType: ctx.actorType, targetId: id, targetType: 'pipeline',
        channel: ctx.channel, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent,
        metadata: { operation: 'pipeline_update', tenantId: ctx.tenantId, changes: dto }, success: true,
      });

      this.metricsService.incrementCounter('screening_pipeline_success', { operation: 'update' });
      this.metricsService.recordLatency('screening_pipeline_request_latency', Date.now() - startTime, { operation: 'update' });

      return { success: true, data: updated };
    } catch (error) {
      console.error('[ScreeningPipeline] Update pipeline error:', error);
      this.metricsService.incrementCounter('screening_pipeline_error', { operation: 'update' });
      return { success: false, error: 'Failed to update pipeline', errorCode: 'INTERNAL_ERROR' };
    }
  }

  private validateStageModuleConfigs(stages: StageInput[]): PipelineOperationResult | null {
    for (const stage of stages) {
      const moduleType = stage.moduleType ?? 'form';
      if (stage.moduleConfig && Object.keys(stage.moduleConfig).length > 0) {
        const result = this.moduleRegistry.validate(moduleType, stage.moduleConfig);
        if (!result.valid) return { success: false, error: `Invalid config for stage "${stage.name}" (${moduleType}): ${result.errors?.join('; ')}`, errorCode: 'INVALID_MODULE_CONFIG' };
      } else if (moduleType !== 'form') {
        return { success: false, error: `Module config is required for stage "${stage.name}" (${moduleType})`, errorCode: 'MISSING_MODULE_CONFIG' };
      }
    }
    return null;
  }
}
