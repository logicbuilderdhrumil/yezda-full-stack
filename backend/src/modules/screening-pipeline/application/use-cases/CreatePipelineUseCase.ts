/**
 * Create Pipeline Use Case
 */
import { v4 as uuidv4 } from 'uuid';
import type { IScreeningPipelineRepository } from '../../domain/ports/screening-pipeline-repository.port.js';
import type { IAuditService } from '../../domain/ports/audit-service.port.js';
import type { IMetricsService } from '../../domain/ports/metrics-service.port.js';
import type { IModuleRegistryService } from '../../domain/ports/module-registry-service.port.js';
import type {
  ScreeningPipeline,
  PipelineStage,
  CreatePipelineDto,
  PipelineOperationResult,
  PipelineContext,
  StageInput,
  ModuleType,
} from '../../domain/entities/screening-pipeline.entity.js';
import { canManagePipelines } from '../../domain/services/pipeline-authorization.service.js';

export class CreatePipelineUseCase {
  constructor(
    private readonly pipelineRepo: IScreeningPipelineRepository,
    private readonly auditService: IAuditService,
    private readonly metricsService: IMetricsService,
    private readonly moduleRegistry: IModuleRegistryService,
  ) {}

  async execute(dto: CreatePipelineDto, ctx: PipelineContext): Promise<PipelineOperationResult<ScreeningPipeline>> {
    const startTime = Date.now();

    if (!canManagePipelines(ctx.actorRoles)) {
      this.auditService.log({
        eventType: 'GUARD_ROLE_DENIED',
        actorId: ctx.actorId, actorType: ctx.actorType, channel: ctx.channel,
        metadata: { operation: 'screening_pipeline_create', tenantId: ctx.tenantId, reason: 'Insufficient permissions' },
        success: false, errorMessage: 'Insufficient permissions',
      });
      return { success: false, error: 'Insufficient permissions to create pipelines', errorCode: 'FORBIDDEN' };
    }

    try {
      const nameExists = await this.pipelineRepo.nameExists(dto.name, ctx.tenantId);
      if (nameExists) {
        return { success: false, error: 'A pipeline with this name already exists', errorCode: 'NAME_EXISTS' };
      }

      const configError = this.validateStageModuleConfigs(dto.stages);
      if (configError) return configError as PipelineOperationResult<ScreeningPipeline>;

      const now = new Date();
      const pipelineId = uuidv4();

      const stages: PipelineStage[] = dto.stages.map((stageInput) => {
        const moduleType: ModuleType = stageInput.moduleType ?? 'form';
        const moduleConfig = stageInput.moduleConfig && Object.keys(stageInput.moduleConfig).length > 0
          ? stageInput.moduleConfig
          : moduleType === 'form' ? { formDefinitionId: stageInput.formDefinitionId } : {};

        return {
          id: uuidv4(), pipelineId, formDefinitionId: stageInput.formDefinitionId,
          name: stageInput.name, description: stageInput.description, order: stageInput.order,
          isRequired: stageInput.isRequired ?? true, estimatedDurationMinutes: stageInput.estimatedDurationMinutes,
          moduleType, moduleConfig: moduleConfig as Record<string, unknown>,
          createdAt: now, updatedAt: now,
        };
      });
      stages.sort((a, b) => a.order - b.order);

      const pipeline: ScreeningPipeline = {
        id: pipelineId, tenantId: ctx.tenantId, name: dto.name, description: dto.description,
        stages, graph: dto.graph ?? null, status: 'draft', version: 1,
        createdBy: ctx.actorId, createdAt: now, updatedAt: now,
      };

      const created = await this.pipelineRepo.create(pipeline);

      this.auditService.log({
        eventType: 'PIPELINE_CREATED',
        actorId: ctx.actorId, actorType: ctx.actorType, targetId: pipelineId, targetType: 'pipeline',
        channel: ctx.channel, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent,
        metadata: { operation: 'pipeline_create', tenantId: ctx.tenantId, name: dto.name, stageCount: stages.length },
        success: true,
      });

      this.metricsService.incrementCounter('screening_pipeline_success', { operation: 'create' });
      this.metricsService.recordLatency('screening_pipeline_request_latency', Date.now() - startTime, { operation: 'create' });

      return { success: true, data: created };
    } catch (error) {
      console.error('[ScreeningPipeline] Create pipeline error:', error);
      this.metricsService.incrementCounter('screening_pipeline_error', { operation: 'create' });
      return { success: false, error: 'Failed to create pipeline', errorCode: 'INTERNAL_ERROR' };
    }
  }

  private validateStageModuleConfigs(stages: StageInput[]): PipelineOperationResult | null {
    for (const stage of stages) {
      const moduleType = stage.moduleType ?? 'form';
      if (stage.moduleConfig && Object.keys(stage.moduleConfig).length > 0) {
        const result = this.moduleRegistry.validate(moduleType, stage.moduleConfig);
        if (!result.valid) {
          return { success: false, error: `Invalid config for stage "${stage.name}" (${moduleType}): ${result.errors?.join('; ')}`, errorCode: 'INVALID_MODULE_CONFIG' };
        }
      } else if (moduleType !== 'form') {
        return { success: false, error: `Module config is required for stage "${stage.name}" (${moduleType})`, errorCode: 'MISSING_MODULE_CONFIG' };
      }
    }
    return null;
  }
}
