/**
 * Audit Service Adapter
 *
 * Adapts the shared audit service to the billing-ledger domain port.
 */
import type { IAuditService } from '../../domain/ports/IAuditService.js';

interface SharedAuditService {
  log(entry: Record<string, unknown>): void;
}

export class AuditServiceAdapter implements IAuditService {
  constructor(private readonly shared: SharedAuditService) {}

  log(entry: {
    eventType: string;
    actorId?: string;
    actorType?: string;
    targetId?: string;
    targetType?: string;
    channel?: string;
    ipAddress?: string;
    metadata?: Record<string, unknown>;
    success: boolean;
    errorMessage?: string;
  }): void {
    this.shared.log(entry);
  }
}
