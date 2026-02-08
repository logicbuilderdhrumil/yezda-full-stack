/**
 * Get Form Use Case
 */
import type {
  IFormBuilderRepository,
  IAuditService,
  IMetricsService,
  ICacheService,
  FormDefinition,
  FormOperationResult,
  GetFormResponse,
  FormContext,
} from '../../domain/index.js';

const FORM_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export class GetFormUseCase {
  constructor(
    private readonly repo: IFormBuilderRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
    private readonly cache: ICacheService,
  ) {}

  async execute(ctx: FormContext, formId: string): Promise<FormOperationResult<GetFormResponse>> {
    const startTime = Date.now();
    const cacheKey = `form:${ctx.tenantId}:${formId}`;

    // Check cache first
    try {
      const cached = await this.cache.get<FormDefinition>(cacheKey);
      if (cached) {
        this.metrics.incrementCounter('form_builder_cache_hit');
        this.metrics.recordLatency('form_builder_request', Date.now() - startTime, { operation: 'get', success: 'true' });

        this.audit.log({
          eventType: 'FORM_ACCESSED',
          actorId: ctx.actorId,
          actorType: ctx.actorType,
          targetId: formId,
          targetType: 'form',
          channel: ctx.channel,
          ipAddress: ctx.ipAddress,
          success: true,
          metadata: { cached: true },
        });

        return { success: true, data: { form: cached, cachedAt: new Date() } };
      }
    } catch {
      // Cache miss or error — fall through to DB
    }

    this.metrics.incrementCounter('form_builder_cache_miss');

    const form = await this.repo.findByIdAndTenant(formId, ctx.tenantId);
    if (!form) {
      this.metrics.recordLatency('form_builder_request', Date.now() - startTime, { operation: 'get', success: 'false' });
      return { success: false, error: 'Form not found', errorCode: 'FORM_NOT_FOUND' };
    }

    // Cache the response
    try {
      await this.cache.set(cacheKey, form, FORM_CACHE_TTL_MS);
    } catch {
      // Non-critical
    }

    this.audit.log({
      eventType: 'FORM_ACCESSED',
      actorId: ctx.actorId,
      actorType: ctx.actorType,
      targetId: formId,
      targetType: 'form',
      channel: ctx.channel,
      ipAddress: ctx.ipAddress,
      success: true,
      metadata: { cached: false },
    });

    this.metrics.recordLatency('form_builder_request', Date.now() - startTime, { operation: 'get', success: 'true' });
    return { success: true, data: { form } };
  }
}
