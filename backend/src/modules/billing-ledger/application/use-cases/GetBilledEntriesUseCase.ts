/**
 * GetBilledEntriesUseCase
 */
import type { IBillingLedgerRepository } from '../../domain/ports/IBillingLedgerRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { IBillingLedgerMetricsService } from '../../domain/ports/IBillingLedgerMetricsService.js';
import type {
  LedgerFilterOptions,
  LedgerListResponse,
  OperationResult,
  RequestContext,
} from '../../domain/entities/ledger.entity.js';
import { toEntryResponse, hasLedgerAccess } from '../../domain/entities/ledger.entity.js';

export class GetBilledEntriesUseCase {
  constructor(
    private readonly repo: IBillingLedgerRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IBillingLedgerMetricsService,
  ) {}

  async execute(
    ctx: RequestContext,
    organizationId: string,
    filters: LedgerFilterOptions,
    requesterRoles: string[],
  ): Promise<OperationResult<LedgerListResponse>> {
    const startTime = Date.now();

    if (!hasLedgerAccess(requesterRoles)) {
      this.audit.log({
        eventType: 'LEDGER_ACCESS_DENIED',
        actorId: ctx.userId,
        actorType: ctx.userType,
        channel: ctx.channel || 'api',
        ipAddress: ctx.ipAddress,
        metadata: { tenantId: ctx.tenantId, organizationId, action: 'list_billed', actualRoles: requesterRoles },
        success: false,
        errorMessage: 'Insufficient permissions for ledger access',
      });
      this.metrics.recordAccessDenied(ctx.tenantId, ctx.userId);
      this.metrics.recordLedgerOperation('billed', false, Date.now() - startTime);
      return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
    }

    try {
      const [{ entries, totalCount }, totals] = await Promise.all([
        this.repo.findBilledEntries(ctx.tenantId, organizationId, filters),
        this.repo.calculateTotals(ctx.tenantId, organizationId, 'billed', filters),
      ]);

      const page = filters.page || 1;
      const pageSize = Math.min(filters.pageSize || 50, 100);
      const totalPages = Math.ceil(totalCount / pageSize);

      this.audit.log({
        eventType: 'LEDGER_BILLED_LIST_READ',
        actorId: ctx.userId,
        actorType: ctx.userType,
        channel: ctx.channel || 'api',
        ipAddress: ctx.ipAddress,
        metadata: { tenantId: ctx.tenantId, organizationId, resultCount: entries.length, totalCount },
        success: true,
      });

      this.metrics.recordLedgerOperation('billed', true, Date.now() - startTime);

      return {
        success: true,
        data: {
          entries: entries.map(toEntryResponse),
          totals,
          pagination: { page, pageSize, totalPages, totalCount, hasMore: page < totalPages },
        },
      };
    } catch (error) {
      console.error('[GetBilledEntriesUseCase] Error:', error);
      this.metrics.recordLedgerOperation('billed', false, Date.now() - startTime);
      return { success: false, error: 'Failed to fetch billed ledger entries', code: 'INTERNAL_ERROR' };
    }
  }
}
