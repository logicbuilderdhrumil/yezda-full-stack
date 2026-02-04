/**
 * Billing Ledger Tests
 * Task 1.4: Tests for ledger filtering and totals
 * Task 1.9: Security/compliance tests for ledger access and export
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BillingLedgerService } from '../src/services/billing-ledger.service.js';
import type {
  LedgerEntry,
  LedgerTotals,
  LedgerFilterOptions,
} from '../src/models/billing-ledger.model.js';

// Mock the repository
vi.mock('../src/repositories/billing-ledger.repository.js', () => ({
  billingLedgerRepository: {
    findBilledEntries: vi.fn(),
    findUnbilledEntries: vi.fn(),
    calculateTotals: vi.fn(),
    createEntry: vi.fn(),
    findById: vi.fn(),
    updateEntry: vi.fn(),
    finalizeEntry: vi.fn(),
    isEntryFinalized: vi.fn(),
  },
}));

// Mock the audit service
vi.mock('../src/services/audit.service.js', () => ({
  auditService: {
    log: vi.fn(),
    logAnomaly: vi.fn(),
  },
}));

// Mock the metrics service
vi.mock('../src/services/billing-ledger-metrics.service.js', () => ({
  billingLedgerMetricsService: {
    recordLedgerOperation: vi.fn(),
    recordAccessDenied: vi.fn(),
    recordImmutabilityViolation: vi.fn(),
    recordRateLimitHit: vi.fn(),
    recordCacheHit: vi.fn(),
    recordCacheMiss: vi.fn(),
    checkSLOs: vi.fn(() => ({ met: true, violations: [] })),
    getHealthSummary: vi.fn(() => ({
      billedListP99Ms: 100,
      billedListP95Ms: 50,
      unbilledListP99Ms: 100,
      unbilledListP95Ms: 50,
      billedSuccessRate: 99.9,
      unbilledSuccessRate: 99.9,
      accessDeniedCount: 0,
      immutabilityViolationCount: 0,
      rateLimitHits: 0,
      cacheHitRate: 80,
      sloViolations: [],
    })),
  },
}));

// Import after mocking
import { billingLedgerRepository } from '../src/repositories/billing-ledger.repository.js';
import { auditService } from '../src/services/audit.service.js';
import { billingLedgerMetricsService } from '../src/services/billing-ledger-metrics.service.js';

describe('BillingLedgerService', () => {
  let service: BillingLedgerService;
  const tenantId = 'tenant-1';
  const organizationId = 'org-1';
  const userId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new BillingLedgerService();
  });

  describe('Billed Ledger Operations', () => {
    // Task 1.4: Test billed ledger filtering
    describe('getBilledEntries', () => {
      const mockEntries: LedgerEntry[] = [
        {
          id: 'entry-1',
          tenantId,
          organizationId,
          entryType: 'screening',
          status: 'billed',
          description: 'Background check',
          quantity: 1,
          unitPrice: 5000,
          totalAmount: 5000,
          currency: 'USD',
          billedAt: new Date(),
          invoiceId: 'inv-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'system',
          createdByType: 'system',
          finalizedAt: new Date(),
        },
      ];

      const mockTotals: LedgerTotals = {
        entryCount: 1,
        totalAmount: 5000,
        currency: 'USD',
        byType: {
          screening: { count: 1, amount: 5000 },
          verification: { count: 0, amount: 0 },
          document_review: { count: 0, amount: 0 },
          subscription: { count: 0, amount: 0 },
          addon: { count: 0, amount: 0 },
          adjustment: { count: 0, amount: 0 },
          credit: { count: 0, amount: 0 },
        },
      };

      it('should return billed entries for authorized user', async () => {
        vi.mocked(billingLedgerRepository.findBilledEntries).mockResolvedValue({
          entries: mockEntries,
          totalCount: 1,
        });
        vi.mocked(billingLedgerRepository.calculateTotals).mockResolvedValue(mockTotals);

        const result = await service.getBilledEntries(
          tenantId,
          organizationId,
          {},
          userId,
          ['billing_admin']
        );

        expect(result.success).toBe(true);
        expect(result.data?.entries).toHaveLength(1);
        expect(result.data?.totals.totalAmount).toBe(5000);
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'LEDGER_BILLED_LIST_READ',
            success: true,
          })
        );
      });

      it('should apply date filters', async () => {
        vi.mocked(billingLedgerRepository.findBilledEntries).mockResolvedValue({
          entries: mockEntries,
          totalCount: 1,
        });
        vi.mocked(billingLedgerRepository.calculateTotals).mockResolvedValue(mockTotals);

        const filters: LedgerFilterOptions = {
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-01-31'),
        };

        await service.getBilledEntries(
          tenantId,
          organizationId,
          filters,
          userId,
          ['system_admin']
        );

        expect(billingLedgerRepository.findBilledEntries).toHaveBeenCalledWith(
          tenantId,
          organizationId,
          filters
        );
      });

      it('should apply entry type filters', async () => {
        vi.mocked(billingLedgerRepository.findBilledEntries).mockResolvedValue({
          entries: mockEntries,
          totalCount: 1,
        });
        vi.mocked(billingLedgerRepository.calculateTotals).mockResolvedValue(mockTotals);

        const filters: LedgerFilterOptions = {
          entryTypes: ['screening', 'verification'],
        };

        await service.getBilledEntries(
          tenantId,
          organizationId,
          filters,
          userId,
          ['org_admin']
        );

        expect(billingLedgerRepository.findBilledEntries).toHaveBeenCalledWith(
          tenantId,
          organizationId,
          expect.objectContaining({
            entryTypes: ['screening', 'verification'],
          })
        );
      });

      // Task 1.9: Security test - deny unauthorized access
      it('should deny access to user without admin role', async () => {
        const result = await service.getBilledEntries(
          tenantId,
          organizationId,
          {},
          userId,
          ['viewer', 'member'] // No admin roles
        );

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('FORBIDDEN');
        expect(billingLedgerMetricsService.recordAccessDenied).toHaveBeenCalledWith(
          tenantId,
          userId
        );
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'LEDGER_ACCESS_DENIED',
            success: false,
          })
        );
      });

      // Task 1.9: Security test - deny access with no roles
      it('should deny access to user with no roles', async () => {
        const result = await service.getBilledEntries(
          tenantId,
          organizationId,
          {},
          userId,
          []
        );

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('FORBIDDEN');
      });
    });
  });

  describe('Unbilled Ledger Operations', () => {
    // Task 1.4: Test unbilled ledger filtering
    describe('getUnbilledEntries', () => {
      const mockEntries: LedgerEntry[] = [
        {
          id: 'entry-2',
          tenantId,
          organizationId,
          entryType: 'verification',
          status: 'unbilled',
          description: 'Identity verification',
          quantity: 2,
          unitPrice: 2500,
          totalAmount: 5000,
          currency: 'USD',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          createdByType: 'user',
        },
      ];

      const mockTotals: LedgerTotals = {
        entryCount: 1,
        totalAmount: 5000,
        currency: 'USD',
        byType: {
          screening: { count: 0, amount: 0 },
          verification: { count: 1, amount: 5000 },
          document_review: { count: 0, amount: 0 },
          subscription: { count: 0, amount: 0 },
          addon: { count: 0, amount: 0 },
          adjustment: { count: 0, amount: 0 },
          credit: { count: 0, amount: 0 },
        },
      };

      it('should return unbilled entries for authorized user', async () => {
        vi.mocked(billingLedgerRepository.findUnbilledEntries).mockResolvedValue({
          entries: mockEntries,
          totalCount: 1,
        });
        vi.mocked(billingLedgerRepository.calculateTotals).mockResolvedValue(mockTotals);

        const result = await service.getUnbilledEntries(
          tenantId,
          organizationId,
          {},
          userId,
          ['billing_admin']
        );

        expect(result.success).toBe(true);
        expect(result.data?.entries).toHaveLength(1);
        expect(result.data?.totals.byType.verification.count).toBe(1);
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'LEDGER_UNBILLED_LIST_READ',
            success: true,
          })
        );
      });

      it('should return correct pagination info', async () => {
        const manyEntries = Array.from({ length: 50 }, (_, i) => ({
          ...mockEntries[0],
          id: `entry-${i}`,
        }));

        vi.mocked(billingLedgerRepository.findUnbilledEntries).mockResolvedValue({
          entries: manyEntries.slice(0, 10),
          totalCount: 50,
        });
        vi.mocked(billingLedgerRepository.calculateTotals).mockResolvedValue(mockTotals);

        const result = await service.getUnbilledEntries(
          tenantId,
          organizationId,
          { page: 1, pageSize: 10 },
          userId,
          ['system_admin']
        );

        expect(result.success).toBe(true);
        expect(result.data?.pagination.page).toBe(1);
        expect(result.data?.pagination.pageSize).toBe(10);
        expect(result.data?.pagination.totalCount).toBe(50);
        expect(result.data?.pagination.totalPages).toBe(5);
        expect(result.data?.pagination.hasMore).toBe(true);
      });

      // Task 1.9: Security test - deny unauthorized access
      it('should deny access to user without admin role', async () => {
        const result = await service.getUnbilledEntries(
          tenantId,
          organizationId,
          {},
          userId,
          ['candidate'] // Invalid role
        );

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('FORBIDDEN');
      });
    });
  });

  describe('Immutability Safeguards', () => {
    // Task 1.6, 1.9: Immutability and compliance tests
    describe('updateEntry', () => {
      it('should allow updating unbilled entry', async () => {
        const mockEntry: LedgerEntry = {
          id: 'entry-1',
          tenantId,
          organizationId,
          entryType: 'screening',
          status: 'unbilled',
          description: 'Updated description',
          quantity: 1,
          unitPrice: 5000,
          totalAmount: 5000,
          currency: 'USD',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          createdByType: 'user',
        };

        vi.mocked(billingLedgerRepository.updateEntry).mockResolvedValue({
          success: true,
          entry: mockEntry,
        });

        const result = await service.updateEntry(
          tenantId,
          organizationId,
          'entry-1',
          { description: 'Updated description' },
          userId,
          ['billing_admin']
        );

        expect(result.success).toBe(true);
        expect(result.entry?.description).toBe('Updated description');
      });

      // Task 1.6, 1.9: Immutability test - reject update to finalized entry
      it('should reject update to finalized entry', async () => {
        vi.mocked(billingLedgerRepository.updateEntry).mockResolvedValue({
          success: false,
          error: 'Cannot modify finalized ledger entry',
        });

        const result = await service.updateEntry(
          tenantId,
          organizationId,
          'entry-1',
          { description: 'Hacked description' },
          userId,
          ['billing_admin']
        );

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('IMMUTABLE_ENTRY');
        expect(billingLedgerMetricsService.recordImmutabilityViolation).toHaveBeenCalledWith(
          tenantId,
          'entry-1'
        );
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'LEDGER_IMMUTABILITY_VIOLATION',
            success: false,
          })
        );
      });

      // Task 1.9: Security test - deny unauthorized update
      it('should deny update from unauthorized user', async () => {
        const result = await service.updateEntry(
          tenantId,
          organizationId,
          'entry-1',
          { description: 'Hacked description' },
          userId,
          ['viewer']
        );

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('FORBIDDEN');
        expect(billingLedgerRepository.updateEntry).not.toHaveBeenCalled();
      });
    });

    describe('finalizeEntry', () => {
      it('should finalize entry for billing admin', async () => {
        const mockEntry: LedgerEntry = {
          id: 'entry-1',
          tenantId,
          organizationId,
          entryType: 'screening',
          status: 'billed',
          description: 'Background check',
          quantity: 1,
          unitPrice: 5000,
          totalAmount: 5000,
          currency: 'USD',
          billedAt: new Date(),
          invoiceId: 'inv-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          createdByType: 'user',
          finalizedAt: new Date(),
        };

        vi.mocked(billingLedgerRepository.finalizeEntry).mockResolvedValue(mockEntry);

        const result = await service.finalizeEntry(
          tenantId,
          organizationId,
          'entry-1',
          'inv-1',
          userId,
          ['billing_admin']
        );

        expect(result.success).toBe(true);
        expect(result.entry?.status).toBe('billed');
        expect(result.entry?.invoiceId).toBe('inv-1');
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'LEDGER_ENTRY_FINALIZED',
            success: true,
          })
        );
      });

      // Task 1.9: Security test - org_admin cannot finalize
      it('should deny finalization from org_admin', async () => {
        const result = await service.finalizeEntry(
          tenantId,
          organizationId,
          'entry-1',
          'inv-1',
          userId,
          ['org_admin'] // Can read but not finalize
        );

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('FORBIDDEN');
        expect(billingLedgerRepository.finalizeEntry).not.toHaveBeenCalled();
      });

      it('should allow finalization from system_admin', async () => {
        const mockEntry: LedgerEntry = {
          id: 'entry-1',
          tenantId,
          organizationId,
          entryType: 'screening',
          status: 'billed',
          description: 'Background check',
          quantity: 1,
          unitPrice: 5000,
          totalAmount: 5000,
          currency: 'USD',
          billedAt: new Date(),
          invoiceId: 'inv-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          createdByType: 'user',
          finalizedAt: new Date(),
        };

        vi.mocked(billingLedgerRepository.finalizeEntry).mockResolvedValue(mockEntry);

        const result = await service.finalizeEntry(
          tenantId,
          organizationId,
          'entry-1',
          'inv-1',
          userId,
          ['system_admin']
        );

        expect(result.success).toBe(true);
      });
    });
  });

  describe('Entry Creation', () => {
    describe('createEntry', () => {
      it('should create entry for authorized user', async () => {
        vi.mocked(billingLedgerRepository.createEntry).mockResolvedValue();

        const result = await service.createEntry(
          tenantId,
          organizationId,
          {
            entryType: 'screening',
            description: 'New background check',
            quantity: 1,
            unitPrice: 5000,
          },
          userId,
          'user',
          ['billing_admin']
        );

        expect(result.success).toBe(true);
        expect(result.entry?.entryType).toBe('screening');
        expect(result.entry?.totalAmount).toBe(5000);
        expect(result.entry?.status).toBe('unbilled');
        expect(auditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            eventType: 'LEDGER_ENTRY_CREATED',
            success: true,
          })
        );
      });

      it('should calculate total amount correctly', async () => {
        vi.mocked(billingLedgerRepository.createEntry).mockResolvedValue();

        const result = await service.createEntry(
          tenantId,
          organizationId,
          {
            entryType: 'verification',
            description: 'Multiple verifications',
            quantity: 5,
            unitPrice: 1000,
          },
          userId,
          'user',
          ['system_admin']
        );

        expect(result.success).toBe(true);
        expect(result.entry?.quantity).toBe(5);
        expect(result.entry?.unitPrice).toBe(1000);
        expect(result.entry?.totalAmount).toBe(5000);
      });

      // Task 1.9: Security test - deny unauthorized creation
      it('should deny creation from unauthorized user', async () => {
        const result = await service.createEntry(
          tenantId,
          organizationId,
          {
            entryType: 'screening',
            description: 'Unauthorized entry',
            quantity: 1,
            unitPrice: 5000,
          },
          userId,
          'user',
          ['member']
        );

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('FORBIDDEN');
        expect(billingLedgerRepository.createEntry).not.toHaveBeenCalled();
      });
    });
  });
});

describe('BillingLedgerMetricsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkSLOs', () => {
    it('should return met=true when all SLOs pass', () => {
      const result = billingLedgerMetricsService.checkSLOs();

      expect(result.met).toBe(true);
      expect(result.violations).toHaveLength(0);
    });
  });

  describe('getHealthSummary', () => {
    it('should return health metrics', () => {
      const summary = billingLedgerMetricsService.getHealthSummary();

      expect(summary).toHaveProperty('billedListP99Ms');
      expect(summary).toHaveProperty('billedListP95Ms');
      expect(summary).toHaveProperty('unbilledListP99Ms');
      expect(summary).toHaveProperty('unbilledListP95Ms');
      expect(summary).toHaveProperty('billedSuccessRate');
      expect(summary).toHaveProperty('unbilledSuccessRate');
      expect(summary).toHaveProperty('accessDeniedCount');
      expect(summary).toHaveProperty('immutabilityViolationCount');
      expect(summary).toHaveProperty('rateLimitHits');
      expect(summary).toHaveProperty('cacheHitRate');
      expect(summary).toHaveProperty('sloViolations');
    });
  });
});
