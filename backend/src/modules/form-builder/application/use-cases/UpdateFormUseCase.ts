/**
 * Update Form Use Case
 */
import type {
  IFormBuilderRepository,
  IAuditService,
  IMetricsService,
  ICacheService,
  FormDefinition,
  FormOperationResult,
  FormContext,
  UpdateFormDto,
} from '../../domain/index.js';
import { validateFieldIdUniqueness, validateConditionalReferences } from '../../domain/index.js';

export class UpdateFormUseCase {
  constructor(
    private readonly repo: IFormBuilderRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
    private readonly cache: ICacheService,
  ) {}

  async execute(ctx: FormContext, formId: string, dto: UpdateFormDto): Promise<FormOperationResult<FormDefinition>> {
    const startTime = Date.now();

    const existing = await this.repo.findByIdAndTenant(formId, ctx.tenantId);
    if (!existing) {
      this.metrics.recordLatency('form_builder_request', Date.now() - startTime, { operation: 'update', success: 'false' });
      return { success: false, error: 'Form not found', errorCode: 'FORM_NOT_FOUND' };
    }

    // Validate sections if provided
    if (dto.sections) {
      const uniquenessCheck = validateFieldIdUniqueness(dto.sections);
      if (!uniquenessCheck.valid) {
        this.metrics.recordLatency('form_builder_request', Date.now() - startTime, { operation: 'update', success: 'false' });
        return { success: false, error: `Duplicate field IDs: ${uniquenessCheck.duplicateIds.join(', ')}`, errorCode: 'DUPLICATE_FIELD_IDS' };
      }

      const refCheck = validateConditionalReferences(dto.sections);
      if (!refCheck.valid) {
        this.metrics.recordLatency('form_builder_request', Date.now() - startTime, { operation: 'update', success: 'false' });
        return { success: false, error: `Invalid conditional references: ${refCheck.invalidRefs.join(', ')}`, errorCode: 'INVALID_CONDITIONAL_REFS' };
      }
    }

    const now = new Date();
    const previousVersion = existing.version;

    const updated = await this.repo.update(formId, {
      name: dto.name ?? existing.name,
      description: dto.description !== undefined ? dto.description : existing.description,
      sections: dto.sections ?? existing.sections,
      settings: dto.settings ? { ...existing.settings, ...dto.settings } : existing.settings,
      status: dto.status ?? existing.status,
      metadata: dto.metadata !== undefined ? dto.metadata : existing.metadata,
      version: existing.version + 1,
      updatedAt: now,
      updatedBy: ctx.actorId,
    });

    if (!updated) {
      this.metrics.recordLatency('form_builder_request', Date.now() - startTime, { operation: 'update', success: 'false' });
      return { success: false, error: 'Failed to update form', errorCode: 'UPDATE_FAILED' };
    }

    // Invalidate caches
    await this.cache.del(`form:${ctx.tenantId}:${formId}`).catch(() => {});

    this.audit.log({
      eventType: 'FORM_UPDATED',
      actorId: ctx.actorId,
      actorType: ctx.actorType,
      targetId: formId,
      targetType: 'form',
      channel: ctx.channel,
      ipAddress: ctx.ipAddress,
      success: true,
      metadata: {
        formName: updated.name,
        previousVersion,
        newVersion: updated.version,
        changes: Object.keys(dto).filter((k) => dto[k as keyof UpdateFormDto] !== undefined),
      },
    });

    this.metrics.recordLatency('form_builder_request', Date.now() - startTime, { operation: 'update', success: 'true' });
    return { success: true, data: updated };
  }
}
