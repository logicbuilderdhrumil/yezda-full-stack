/**
 * Delete Form Use Case
 */
import type {
  IFormBuilderRepository,
  IAuditService,
  IMetricsService,
  ICacheService,
  FormOperationResult,
  FormContext,
} from '../../domain/index.js';

export class DeleteFormUseCase {
  constructor(
    private readonly repo: IFormBuilderRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
    private readonly cache: ICacheService,
  ) {}

  async execute(ctx: FormContext, formId: string): Promise<FormOperationResult<void>> {
    const startTime = Date.now();

    const existing = await this.repo.findByIdAndTenant(formId, ctx.tenantId);
    if (!existing) {
      this.metrics.recordLatency('form_builder_request', Date.now() - startTime, { operation: 'delete', success: 'false' });
      return { success: false, error: 'Form not found', errorCode: 'FORM_NOT_FOUND' };
    }

    // Soft delete: archive the form
    await this.repo.updateStatus(formId, 'archived');

    // Invalidate caches
    await this.cache.del(`form:${ctx.tenantId}:${formId}`).catch(() => {});

    this.audit.log({
      eventType: 'FORM_DELETED',
      actorId: ctx.actorId,
      actorType: ctx.actorType,
      targetId: formId,
      targetType: 'form',
      channel: ctx.channel,
      ipAddress: ctx.ipAddress,
      success: true,
      metadata: { formName: existing.name },
    });

    this.metrics.recordLatency('form_builder_request', Date.now() - startTime, { operation: 'delete', success: 'true' });
    return { success: true };
  }
}
