/**
 * Billing Ledger Service
 * Task 1.2, 1.3, 1.5, 1.6: Ledger management with RBAC, audit, and immutability
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  LedgerEntry,
  LedgerEntryResponse,
  LedgerFilterOptions,
  LedgerListResponse,
  LedgerTotals,
  CreateLedgerEntryRequest,
} from '../models/billing-ledger.model.js';
import { billingLedgerRepository } from '../repositories/billing-ledger.repository.js';
import { auditService } from './audit.service.js';
import { billingLedgerMetricsService } from './billing-ledger-metrics.service.js';

export interface LedgerListResult {
  success: boolean;
  data?: LedgerListResponse;
  error?: string;
  errorCode?: string;
}

export interface LedgerTotalsResult {
  success: boolean;
  totals?: LedgerTotals;
  error?: string;
  errorCode?: string;
}

export interface LedgerEntryResult {
  success: boolean;
  entry?: LedgerEntryResponse;
  error?: string;
  errorCode?: string;
}

/**
 * Convert internal entry to response format
 */
function toEntryResponse(entry: LedgerEntry): LedgerEntryResponse {
  return {
    id: entry.id,
    entryType: entry.entryType,
    status: entry.status,
    description: entry.description,
    quantity: entry.quantity,
    unitPrice: entry.unitPrice,
    totalAmount: entry.totalAmount,
    currency: entry.currency,
    referenceId: entry.referenceId,
    referenceType: entry.referenceType,
    billedAt: entry.billedAt,
    invoiceId: entry.invoiceId,
    createdAt: entry.createdAt,
    finalizedAt: entry.finalizedAt,
  };
}

/**
 * Check if user role has ledger access
 * Task 1.5: RBAC enforcement
 */
function hasLedgerAccess(userRoles: string[]): boolean {
  const allowedRoles: readonly string[] = ['system_admin', 'billing_admin', 'org_admin'];
  return userRoles.some((role) => allowedRoles.includes(role));
}

export class BillingLedgerService {
  /**
   * Get billed ledger entries
   * Task 1.2: Billed ledger list endpoint with filters and totals
   */
  async getBilledEntries(
    tenantId: string,
    organizationId: string,
    filters: LedgerFilterOptions,
    requesterId: string,
    requesterRoles: string[],
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string
  ): Promise<LedgerListResult> {
    const startTime = Date.now();

    try {
      // Task 1.5: Enforce RBAC
      if (!hasLedgerAccess(requesterRoles)) {
        auditService.log({
          eventType: 'LEDGER_ACCESS_DENIED' as any,
          actorId: requesterId,
          actorType: 'user',
          channel,
          ipAddress,
          metadata: {
            tenantId,
            organizationId,
            action: 'list_billed',
            requiredRoles: ['system_admin', 'billing_admin', 'org_admin'],
            actualRoles: requesterRoles,
          },
          success: false,
          errorMessage: 'Insufficient permissions for ledger access',
        });

        billingLedgerMetricsService.recordAccessDenied(tenantId, requesterId);
        billingLedgerMetricsService.recordLedgerOperation('billed', false, Date.now() - startTime);

        return {
          success: false,
          error: 'Access denied',
          errorCode: 'FORBIDDEN',
        };
      }

      // Fetch entries and totals
      const [{ entries, totalCount }, totals] = await Promise.all([
        billingLedgerRepository.findBilledEntries(tenantId, organizationId, filters),
        billingLedgerRepository.calculateTotals(tenantId, organizationId, 'billed', filters),
      ]);

      const page = filters.page || 1;
      const pageSize = Math.min(filters.pageSize || 50, 100);
      const totalPages = Math.ceil(totalCount / pageSize);

      // Task 1.6: Audit logging
      auditService.log({
        eventType: 'LEDGER_BILLED_LIST_READ' as any,
        actorId: requesterId,
        actorType: 'user',
        channel,
        ipAddress,
        metadata: {
          tenantId,
          organizationId,
          filters,
          resultCount: entries.length,
          totalCount,
        },
        success: true,
      });

      billingLedgerMetricsService.recordLedgerOperation('billed', true, Date.now() - startTime);

      return {
        success: true,
        data: {
          entries: entries.map(toEntryResponse),
          totals,
          pagination: {
            page,
            pageSize,
            totalPages,
            totalCount,
            hasMore: page < totalPages,
          },
        },
      };
    } catch (error) {
      console.error('[BillingLedgerService] Error fetching billed entries:', error);
      billingLedgerMetricsService.recordLedgerOperation('billed', false, Date.now() - startTime);
      return {
        success: false,
        error: 'Failed to fetch billed ledger entries',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Get unbilled ledger entries
   * Task 1.3: Unbilled ledger list endpoint with filters and totals
   */
  async getUnbilledEntries(
    tenantId: string,
    organizationId: string,
    filters: LedgerFilterOptions,
    requesterId: string,
    requesterRoles: string[],
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string
  ): Promise<LedgerListResult> {
    const startTime = Date.now();

    try {
      // Task 1.5: Enforce RBAC
      if (!hasLedgerAccess(requesterRoles)) {
        auditService.log({
          eventType: 'LEDGER_ACCESS_DENIED' as any,
          actorId: requesterId,
          actorType: 'user',
          channel,
          ipAddress,
          metadata: {
            tenantId,
            organizationId,
            action: 'list_unbilled',
            requiredRoles: ['system_admin', 'billing_admin', 'org_admin'],
            actualRoles: requesterRoles,
          },
          success: false,
          errorMessage: 'Insufficient permissions for ledger access',
        });

        billingLedgerMetricsService.recordAccessDenied(tenantId, requesterId);
        billingLedgerMetricsService.recordLedgerOperation('unbilled', false, Date.now() - startTime);

        return {
          success: false,
          error: 'Access denied',
          errorCode: 'FORBIDDEN',
        };
      }

      // Fetch entries and totals
      const [{ entries, totalCount }, totals] = await Promise.all([
        billingLedgerRepository.findUnbilledEntries(tenantId, organizationId, filters),
        billingLedgerRepository.calculateTotals(tenantId, organizationId, 'unbilled', filters),
      ]);

      const page = filters.page || 1;
      const pageSize = Math.min(filters.pageSize || 50, 100);
      const totalPages = Math.ceil(totalCount / pageSize);

      // Task 1.6: Audit logging
      auditService.log({
        eventType: 'LEDGER_UNBILLED_LIST_READ' as any,
        actorId: requesterId,
        actorType: 'user',
        channel,
        ipAddress,
        metadata: {
          tenantId,
          organizationId,
          filters,
          resultCount: entries.length,
          totalCount,
        },
        success: true,
      });

      billingLedgerMetricsService.recordLedgerOperation('unbilled', true, Date.now() - startTime);

      return {
        success: true,
        data: {
          entries: entries.map(toEntryResponse),
          totals,
          pagination: {
            page,
            pageSize,
            totalPages,
            totalCount,
            hasMore: page < totalPages,
          },
        },
      };
    } catch (error) {
      console.error('[BillingLedgerService] Error fetching unbilled entries:', error);
      billingLedgerMetricsService.recordLedgerOperation('unbilled', false, Date.now() - startTime);
      return {
        success: false,
        error: 'Failed to fetch unbilled ledger entries',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Create a new ledger entry
   * Task 1.6: Audit logging
   */
  async createEntry(
    tenantId: string,
    organizationId: string,
    request: CreateLedgerEntryRequest,
    createdBy: string,
    createdByType: 'user' | 'system',
    requesterRoles: string[],
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string
  ): Promise<LedgerEntryResult> {
    try {
      // Task 1.5: Enforce RBAC
      if (!hasLedgerAccess(requesterRoles)) {
        auditService.log({
          eventType: 'LEDGER_ACCESS_DENIED' as any,
          actorId: createdBy,
          actorType: createdByType,
          channel,
          ipAddress,
          metadata: {
            tenantId,
            organizationId,
            action: 'create_entry',
            requiredRoles: ['system_admin', 'billing_admin', 'org_admin'],
            actualRoles: requesterRoles,
          },
          success: false,
          errorMessage: 'Insufficient permissions to create ledger entry',
        });

        billingLedgerMetricsService.recordAccessDenied(tenantId, createdBy);
        return {
          success: false,
          error: 'Access denied',
          errorCode: 'FORBIDDEN',
        };
      }

      const now = new Date();
      const entry: LedgerEntry = {
        id: uuidv4(),
        tenantId,
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
        createdBy,
        createdByType,
        metadata: request.metadata,
      };

      await billingLedgerRepository.createEntry(entry);

      // Task 1.6: Audit logging
      auditService.log({
        eventType: 'LEDGER_ENTRY_CREATED' as any,
        actorId: createdBy,
        actorType: createdByType,
        targetId: entry.id,
        targetType: 'ledger_entry',
        channel,
        ipAddress,
        metadata: {
          tenantId,
          organizationId,
          entryType: entry.entryType,
          totalAmount: entry.totalAmount,
          currency: entry.currency,
        },
        success: true,
      });

      return {
        success: true,
        entry: toEntryResponse(entry),
      };
    } catch (error) {
      console.error('[BillingLedgerService] Error creating entry:', error);
      return {
        success: false,
        error: 'Failed to create ledger entry',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Attempt to update a ledger entry
   * Task 1.6: Immutability check - reject updates to finalized entries
   */
  async updateEntry(
    tenantId: string,
    organizationId: string,
    entryId: string,
    updates: { description?: string; metadata?: Record<string, unknown> },
    requesterId: string,
    requesterRoles: string[],
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string
  ): Promise<LedgerEntryResult> {
    try {
      // Task 1.5: Enforce RBAC
      if (!hasLedgerAccess(requesterRoles)) {
        auditService.log({
          eventType: 'LEDGER_ACCESS_DENIED' as any,
          actorId: requesterId,
          actorType: 'user',
          channel,
          ipAddress,
          metadata: {
            tenantId,
            organizationId,
            entryId,
            action: 'update_entry',
          },
          success: false,
          errorMessage: 'Insufficient permissions to update ledger entry',
        });

        billingLedgerMetricsService.recordAccessDenied(tenantId, requesterId);
        return {
          success: false,
          error: 'Access denied',
          errorCode: 'FORBIDDEN',
        };
      }

      const result = await billingLedgerRepository.updateEntry(
        tenantId,
        organizationId,
        entryId,
        updates
      );

      if (!result.success) {
        // Task 1.6: Audit immutability violation
        if (result.error === 'Cannot modify finalized ledger entry') {
          auditService.log({
            eventType: 'LEDGER_IMMUTABILITY_VIOLATION' as any,
            actorId: requesterId,
            actorType: 'user',
            targetId: entryId,
            targetType: 'ledger_entry',
            channel,
            ipAddress,
            metadata: {
              tenantId,
              organizationId,
              attemptedUpdates: Object.keys(updates),
            },
            success: false,
            errorMessage: 'Attempted to modify finalized ledger entry',
          });

          billingLedgerMetricsService.recordImmutabilityViolation(tenantId, entryId);

          return {
            success: false,
            error: 'Cannot modify finalized ledger entry',
            errorCode: 'IMMUTABLE_ENTRY',
          };
        }

        return {
          success: false,
          error: result.error || 'Failed to update entry',
          errorCode: 'UPDATE_FAILED',
        };
      }

      return {
        success: true,
        entry: result.entry ? toEntryResponse(result.entry) : undefined,
      };
    } catch (error) {
      console.error('[BillingLedgerService] Error updating entry:', error);
      return {
        success: false,
        error: 'Failed to update ledger entry',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Finalize a ledger entry (mark as billed and immutable)
   * Task 1.6: Immutability safeguards
   */
  async finalizeEntry(
    tenantId: string,
    organizationId: string,
    entryId: string,
    invoiceId: string,
    requesterId: string,
    requesterRoles: string[],
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string
  ): Promise<LedgerEntryResult> {
    try {
      // Task 1.5: Only system_admin or billing_admin can finalize
      const canFinalize = requesterRoles.some((r) =>
        ['system_admin', 'billing_admin'].includes(r)
      );

      if (!canFinalize) {
        auditService.log({
          eventType: 'LEDGER_ACCESS_DENIED' as any,
          actorId: requesterId,
          actorType: 'user',
          targetId: entryId,
          targetType: 'ledger_entry',
          channel,
          ipAddress,
          metadata: {
            tenantId,
            organizationId,
            action: 'finalize_entry',
            requiredRoles: ['system_admin', 'billing_admin'],
            actualRoles: requesterRoles,
          },
          success: false,
          errorMessage: 'Insufficient permissions to finalize ledger entry',
        });

        billingLedgerMetricsService.recordAccessDenied(tenantId, requesterId);
        return {
          success: false,
          error: 'Access denied',
          errorCode: 'FORBIDDEN',
        };
      }

      const entry = await billingLedgerRepository.finalizeEntry(
        tenantId,
        organizationId,
        entryId,
        invoiceId
      );

      if (!entry) {
        return {
          success: false,
          error: 'Entry not found or already finalized',
          errorCode: 'NOT_FOUND',
        };
      }

      // Task 1.6: Audit logging
      auditService.log({
        eventType: 'LEDGER_ENTRY_FINALIZED' as any,
        actorId: requesterId,
        actorType: 'user',
        targetId: entryId,
        targetType: 'ledger_entry',
        channel,
        ipAddress,
        metadata: {
          tenantId,
          organizationId,
          invoiceId,
          totalAmount: entry.totalAmount,
          currency: entry.currency,
        },
        success: true,
      });

      return {
        success: true,
        entry: toEntryResponse(entry),
      };
    } catch (error) {
      console.error('[BillingLedgerService] Error finalizing entry:', error);
      return {
        success: false,
        error: 'Failed to finalize ledger entry',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }
}

export const billingLedgerService = new BillingLedgerService();
