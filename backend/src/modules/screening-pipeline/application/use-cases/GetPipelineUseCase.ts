/**
 * Get Pipeline Use Case
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

export class GetPipelineUseCase {
  constructor(
    private readonly pipelineRepo: IScreeningPipelineRepository,
    private readonly auditService: IAuditService,
    private readonly metricsService: IMetricsService,
  ) {}

  async execute(id: string, ctx: PipelineContext): Promise<PipelineOperationResult<ScreeningPipeline>> {
    const startTime = Date.now();

    if (!canViewPipelines(ctx.actorRoles)) {
      this.auditService.log({
        eventType: 'GUARD_ROLE_DENIED',
        actorId: ctx.actorId, actorType: ctx.actorType, channel: ctx.channel, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent,
        metadata: { operation: 'screening_pipeline_view', tenantId: ctx.tenantId, reason: 'Insufficient permissions' },
        success: false, errorMessage: 'Insufficient permissions',
      });
      return { success: false, error: 'Insufficient permissions to view pipeline', errorCode: 'FORBIDDEN' };
    }

    try {
      const pipeline = await this.pipelineRepo.findByIdAndTenant(id, ctx.tenantId);
      if (!pipeline) {
        return { success: false, error: 'Pipeline not found', errorCode: 'NOT_FOUND' };
      }

      this.auditService.log({
        eventType: 'GUARD_ACCESS_GRANTED',
        actorId: ctx.actorId, actorType: ctx.actorType, targetId: id, targetType: 'pipeline',
        channel: ctx.channel, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent,
        metadata: { operation: 'pipeline_view', tenantId: ctx.tenantId },
        success: true,
      });

      this.metricsService.recordLatency('screening_pipeline_request_latency', Date.now() - startTime, { operation: 'view' });

      return { success: true, data: pipeline };
    } catch (error) {
      console.error('[ScreeningPipeline] Get pipeline error:', error);
      return { success: false, error: 'Failed to get pipeline', errorCode: 'INTERNAL_ERROR' };
    }
  }
}
