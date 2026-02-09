/**
 * List Forms Use Case
 */
import type {
  IFormBuilderRepository,
  IMetricsService,
  ICacheService,
  FormOperationResult,
  FormContext,
  ListFormsQuery,
  ListFormsResponse,
  FormDefinitionSummary,
} from '../../domain/index.js';
import { countFormFields } from '../../domain/index.js';

const LIST_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export class ListFormsUseCase {
  constructor(
    private readonly repo: IFormBuilderRepository,
    private readonly metrics: IMetricsService,
    private readonly cache: ICacheService,
  ) {}

  async execute(ctx: FormContext, query: ListFormsQuery): Promise<FormOperationResult<ListFormsResponse>> {
    const startTime = Date.now();
    const cacheKey = `form-list:${ctx.tenantId}:${JSON.stringify(query)}`;

    // Check cache first
    try {
      const cached = await this.cache.get<ListFormsResponse>(cacheKey);
      if (cached) {
        this.metrics.incrementCounter('form_builder_cache_hit');
        this.metrics.recordLatency('form_builder_request', Date.now() - startTime, { operation: 'list', success: 'true' });
        return { success: true, data: cached };
      }
    } catch (err) {
      // Fall through
    }

    this.metrics.incrementCounter('form_builder_cache_miss');

    const { forms, total } = await this.repo.findAll(ctx.tenantId, query);

    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const summaries: FormDefinitionSummary[] = forms.map((f) => ({
      id: f.id,
      tenantId: f.tenantId,
      name: f.name,
      description: f.description,
      version: f.version,
      status: f.status,
      fieldCount: countFormFields(f.sections),
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }));

    const response: ListFormsResponse = { forms: summaries, total, limit, offset };

    // Cache the response
    try {
      await this.cache.set(cacheKey, response, LIST_CACHE_TTL_MS);
    } catch (err) {
      // Non-critical
    }

    this.metrics.recordLatency('form_builder_request', Date.now() - startTime, { operation: 'list', success: 'true' });
    return { success: true, data: response };
  }
}
