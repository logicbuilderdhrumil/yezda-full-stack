/**
 * Create Form Use Case
 */
import { v4 as uuidv4 } from 'uuid';
import type {
  IFormBuilderRepository,
  IAuditService,
  IMetricsService,
  FormDefinition,
  FormOperationResult,
  FormContext,
  CreateFormDto,
} from '../../domain/index.js';
import { validateFieldIdUniqueness, validateConditionalReferences, countFormFields } from '../../domain/index.js';

export class CreateFormUseCase {
  constructor(
    private readonly repo: IFormBuilderRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(ctx: FormContext, dto: CreateFormDto): Promise<FormOperationResult<FormDefinition>> {
    const startTime = Date.now();

    // Validate field ID uniqueness
    const uniquenessCheck = validateFieldIdUniqueness(dto.sections);
    if (!uniquenessCheck.valid) {
      this.metrics.recordLatency('form_builder_request', Date.now() - startTime, { operation: 'create', success: 'false' });
      return { success: false, error: `Duplicate field IDs: ${uniquenessCheck.duplicateIds.join(', ')}`, errorCode: 'DUPLICATE_FIELD_IDS' };
    }

    // Validate conditional references
    const refCheck = validateConditionalReferences(dto.sections);
    if (!refCheck.valid) {
      this.metrics.recordLatency('form_builder_request', Date.now() - startTime, { operation: 'create', success: 'false' });
      return { success: false, error: `Invalid conditional references: ${refCheck.invalidRefs.join(', ')}`, errorCode: 'INVALID_CONDITIONAL_REFS' };
    }

    const now = new Date();
    const form: FormDefinition = {
      id: uuidv4(),
      tenantId: ctx.tenantId,
      name: dto.name,
      description: dto.description,
      version: 1,
      status: dto.status ?? 'draft',
      sections: dto.sections,
      settings: dto.settings ?? {},
      metadata: dto.metadata,
      createdAt: now,
      createdBy: ctx.actorId,
      updatedAt: now,
      updatedBy: ctx.actorId,
    };

    const created = await this.repo.create(form);

    this.audit.log({
      eventType: 'FORM_CREATED',
      actorId: ctx.actorId,
      actorType: ctx.actorType,
      targetId: created.id,
      targetType: 'form',
      channel: ctx.channel,
      ipAddress: ctx.ipAddress,
      success: true,
      metadata: { formName: created.name, fieldCount: countFormFields(created.sections) },
    });

    this.metrics.recordLatency('form_builder_request', Date.now() - startTime, { operation: 'create', success: 'true' });
    return { success: true, data: created };
  }
}
