/**
 * FinalizeEntryUseCase
 */
import type { IBillingLedgerRepository } from '../../domain/ports/IBillingLedgerRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { IBillingLedgerMetricsService } from '../../domain/ports/IBillingLedgerMetricsService.js';
import type {
  LedgerEntryResponse,
  OperationResult,
  RequestContext,
} from '../../domain/entities/ledger.entity.js';
import { toEntryResponse } from '../../domain/entities/ledger.entity.js';

export class FinalizeEntryUseCase {
  constructor(
    private readonly repo: IBillingLedgerRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IBillingLedgerMetricsService,
  ) {}

  async execute(
    ctx: RequestContext,
    organizationId: string,
    entryId: string,
    invoiceId: string,
    requesterRoles: string[],
  ): Promise<OperationResult<LedgerEntryResponse>> {
    const canFinalize = requesterRoles.some((r) =>
      ['system_admin', 'billing_admin'].includes(r),
    );

    if (!canFinalize) {
      this.audit.log({
        eventType: 'LEDGER_ACCESS_DENIED',
        actorId: ctx.userId,
        actorType: ctx.userType,
        targetId: entryId,
        targetType: 'ledger_entry',
        channel: ctx.channel || 'api',
        ipAddress: ctx.ipAddress,
        metadata: { tenantId: ctx.tenantId, organizationId, action: 'finalize_entry', actualRoles: requesterRoles },
        success: false,
        errorMessage: 'Insufficient permissions to finalize ledger entry',
      });
      this.metrics.recordAccessDenied(ctx.tenantId, ctx.userId);
      return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
    }

    try {
      const entry = await this.repo.finalizeEntry(ctx.tenantId, organizationId, entryId, invoiceId);

      if (!entry) {
        return { success: false, error: 'Entry not found or already finalized', code: 'NOT_FOUND' };
      }

      this.audit.log({
        eventType: 'LEDGER_ENTRY_FINALIZED',
        actorId: ctx.userId,
        actorType: ctx.userType,
        targetId: entryId,
        targetType: 'ledger_entry',
        channel: ctx.channel || 'api',
        ipAddress: ctx.ipAddress,
        metadata: { tenantId: ctx.tenantId, organizationId, invoiceId, totalAmount: entry.totalAmount },
        success: true,
      });

      return { success: true, data: toEntryResponse(entry) };
    } catch (error) {
      console.error('[FinalizeEntryUseCase] Error:', error);
      return { success: false, error: 'Failed to finalize ledger entry', code: 'INTERNAL_ERROR' };
    }
  }
}
