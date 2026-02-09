/**
 * List Pipelines Use Case
 */
import type { IScreeningPipelineRepository } from '../../domain/ports/screening-pipeline-repository.port.js';
import type { IAuditService } from '../../domain/ports/audit-service.port.js';
import type { IMetricsService } from '../../domain/ports/metrics-service.port.js';
import type {
  ScreeningPipeline,
  PipelineOperationResult,
  PipelineContext,
} from '../../domain/entities/screening-pipeline.entity.js';
import { canViewPipelines } from '../../domain/services/pipeline-authorization.service.js';

export class ListPipelinesUseCase {
  constructor(
    private readonly pipelineRepo: IScreeningPipelineRepository,
    private readonly auditService: IAuditService,
    private readonly metricsService: IMetricsService,
  ) {}

  async execute(ctx: PipelineContext): Promise<PipelineOperationResult<ScreeningPipeline[]>> {
    const startTime = Date.now();

    if (!canViewPipelines(ctx.actorRoles)) {
      this.auditService.log({
        eventType: 'GUARD_ROLE_DENIED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { operation: 'screening_pipeline_list', tenantId: ctx.tenantId, reason: 'Insufficient permissions', actorRoles: ctx.actorRoles },
        success: false,
        errorMessage: 'Insufficient permissions',
      });
      this.metricsService.incrementCounter('screening_pipeline_access_denied', { operation: 'list' });
      return { success: false, error: 'Insufficient permissions to list pipelines', errorCode: 'FORBIDDEN' };
    }

    try {
      const pipelines = await this.pipelineRepo.findAll(ctx.tenantId);

      this.auditService.log({
        eventType: 'GUARD_ACCESS_GRANTED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { operation: 'pipeline_list', tenantId: ctx.tenantId, resultCount: pipelines.length },
        success: true,
      });

      this.metricsService.recordLatency('screening_pipeline_request_latency', Date.now() - startTime, { operation: 'list' });

      return { success: true, data: pipelines };
    } catch (error) {
      console.error('[ScreeningPipeline] List pipelines error:', error);
      this.metricsService.incrementCounter('screening_pipeline_error', { operation: 'list' });
      return { success: false, error: 'Failed to list pipelines', errorCode: 'INTERNAL_ERROR' };
    }
  }
}
