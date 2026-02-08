/**
 * UpdateEntryUseCase
 */
import type { IBillingLedgerRepository } from '../../domain/ports/IBillingLedgerRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { IBillingLedgerMetricsService } from '../../domain/ports/IBillingLedgerMetricsService.js';
import type {
  LedgerEntryResponse,
  OperationResult,
  RequestContext,
} from '../../domain/entities/ledger.entity.js';
import { toEntryResponse, hasLedgerAccess } from '../../domain/entities/ledger.entity.js';

export class UpdateEntryUseCase {
  constructor(
    private readonly repo: IBillingLedgerRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IBillingLedgerMetricsService,
  ) {}

  async execute(
    ctx: RequestContext,
    organizationId: string,
    entryId: string,
    updates: { description?: string; metadata?: Record<string, unknown> },
    requesterRoles: string[],
  ): Promise<OperationResult<LedgerEntryResponse>> {
    if (!hasLedgerAccess(requesterRoles)) {
      this.audit.log({
        eventType: 'LEDGER_ACCESS_DENIED',
        actorId: ctx.userId,
        actorType: ctx.userType,
        channel: ctx.channel || 'api',
        ipAddress: ctx.ipAddress,
        metadata: { tenantId: ctx.tenantId, organizationId, entryId, action: 'update_entry' },
        success: false,
        errorMessage: 'Insufficient permissions to update ledger entry',
      });
      this.metrics.recordAccessDenied(ctx.tenantId, ctx.userId);
      return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
    }

    try {
      const result = await this.repo.updateEntry(ctx.tenantId, organizationId, entryId, updates);

      if (!result.success) {
        if (result.error === 'Cannot modify finalized ledger entry') {
          this.audit.log({
            eventType: 'LEDGER_IMMUTABILITY_VIOLATION',
            actorId: ctx.userId,
            actorType: ctx.userType,
            targetId: entryId,
            targetType: 'ledger_entry',
            channel: ctx.channel || 'api',
            ipAddress: ctx.ipAddress,
            metadata: { tenantId: ctx.tenantId, organizationId, attemptedUpdates: Object.keys(updates) },
            success: false,
            errorMessage: 'Attempted to modify finalized ledger entry',
          });
          this.metrics.recordImmutabilityViolation(ctx.tenantId, entryId);
          return { success: false, error: 'Cannot modify finalized ledger entry', code: 'IMMUTABLE_ENTRY' };
        }
        return { success: false, error: result.error || 'Failed to update entry', code: 'UPDATE_FAILED' };
      }

      return {
        success: true,
        data: result.entry ? toEntryResponse(result.entry) : ({} as LedgerEntryResponse),
      };
    } catch (error) {
      console.error('[UpdateEntryUseCase] Error:', error);
      return { success: false, error: 'Failed to update ledger entry', code: 'INTERNAL_ERROR' };
    }
  }
}
