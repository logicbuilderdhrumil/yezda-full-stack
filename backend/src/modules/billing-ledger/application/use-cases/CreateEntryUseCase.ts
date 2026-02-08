/**
 * CreateEntryUseCase
 */
import type { IBillingLedgerRepository } from '../../domain/ports/IBillingLedgerRepository.js';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { IBillingLedgerMetricsService } from '../../domain/ports/IBillingLedgerMetricsService.js';
import type {
  CreateLedgerEntryRequest,
  LedgerEntry,
  LedgerEntryResponse,
  OperationResult,
  RequestContext,
} from '../../domain/entities/ledger.entity.js';
import { toEntryResponse, hasLedgerAccess } from '../../domain/entities/ledger.entity.js';

function generateId(): string {
  return crypto.randomUUID();
}

export class CreateEntryUseCase {
  constructor(
    private readonly repo: IBillingLedgerRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IBillingLedgerMetricsService,
  ) {}

  async execute(
    ctx: RequestContext,
    organizationId: string,
    request: CreateLedgerEntryRequest,
    requesterRoles: string[],
  ): Promise<OperationResult<LedgerEntryResponse>> {
    if (!hasLedgerAccess(requesterRoles)) {
      this.audit.log({
        eventType: 'LEDGER_ACCESS_DENIED',
        actorId: ctx.userId,
        actorType: ctx.userType,
        channel: ctx.channel || 'api',
        ipAddress: ctx.ipAddress,
        metadata: { tenantId: ctx.tenantId, organizationId, action: 'create_entry' },
        success: false,
        errorMessage: 'Insufficient permissions to create ledger entry',
      });
      this.metrics.recordAccessDenied(ctx.tenantId, ctx.userId);
      return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
    }

    try {
      const now = new Date();
      const entry: LedgerEntry = {
        id: generateId(),
        tenantId: ctx.tenantId,
        organizationId,
        entryType: request.entryType,
        status: 'unbilled',
        description: request.description,
        quantity: request.quantity,
        unitPrice: request.unitPrice,
        totalAmount: request.quantity * request.unitPrice,
        currency: request.currency || 'USD',
        referenceId: request.referenceId,
        referenceType: request.referenceType,
        createdAt: now,
        updatedAt: now,
        createdBy: ctx.userId,
        createdByType: ctx.userType === 'user' ? 'user' : 'system',
        metadata: request.metadata,
      };

      await this.repo.createEntry(entry);

      this.audit.log({
        eventType: 'LEDGER_ENTRY_CREATED',
        actorId: ctx.userId,
        actorType: ctx.userType,
        targetId: entry.id,
        targetType: 'ledger_entry',
        channel: ctx.channel || 'api',
        ipAddress: ctx.ipAddress,
        metadata: { tenantId: ctx.tenantId, organizationId, entryType: entry.entryType, totalAmount: entry.totalAmount },
        success: true,
      });

      return { success: true, data: toEntryResponse(entry) };
    } catch (error) {
      console.error('[CreateEntryUseCase] Error:', error);
      return { success: false, error: 'Failed to create ledger entry', code: 'INTERNAL_ERROR' };
    }
  }
}
