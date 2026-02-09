/**
 * Billing Ledger Routes — Clean Architecture
 */
import { Router } from 'express';
import { requireAuth as requireAuthGuard } from '../../../../shared/infrastructure/middleware/index.js';
import {
  billedLedgerRateLimiter,
  unbilledLedgerRateLimiter,
} from '../../../../middleware/billing-ledger-rate-limit.middleware.js';
import { validateBody, validateQuery } from '../../../../shared/infrastructure/middleware/index.js';
import { z } from 'zod';
import type { BillingLedgerController } from '../controllers/billing-ledger.controller.js';

const ledgerFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  entryTypes: z.string().optional(),
  minAmount: z.string().regex(/^\d+$/).optional(),
  maxAmount: z.string().regex(/^\d+$/).optional(),
  invoiceId: z.string().uuid().optional(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  pageSize: z.string().regex(/^\d+$/).optional(),
  sortBy: z.enum(['createdAt', 'totalAmount', 'billedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const createEntrySchema = z.object({
  entryType: z.enum(['screening', 'verification', 'document_review', 'subscription', 'addon', 'adjustment', 'credit']),
  description: z.string().min(1).max(500),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().min(0),
  currency: z.string().length(3).optional(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateEntrySchema = z.object({
  description: z.string().min(1).max(500).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const finalizeEntrySchema = z.object({
  invoiceId: z.string().min(1),
});

export function createBillingLedgerRoutes(controller: BillingLedgerController): Router {
  const router = Router();

  // Organization-scoped routes
  router.get(
    '/organizations/:organizationId/ledger/billed',
    requireAuthGuard,
    billedLedgerRateLimiter,
    validateQuery(ledgerFilterSchema),
    controller.handleGetBilledEntries,
  );

  router.get(
    '/organizations/:organizationId/ledger/unbilled',
    requireAuthGuard,
    unbilledLedgerRateLimiter,
    validateQuery(ledgerFilterSchema),
    controller.handleGetUnbilledEntries,
  );

  router.post(
    '/organizations/:organizationId/ledger/entries',
    requireAuthGuard,
    validateBody(createEntrySchema),
    controller.handleCreateEntry,
  );

  router.patch(
    '/organizations/:organizationId/ledger/entries/:entryId',
    requireAuthGuard,
    validateBody(updateEntrySchema),
    controller.handleUpdateEntry,
  );

  router.post(
    '/organizations/:organizationId/ledger/entries/:entryId/finalize',
    requireAuthGuard,
    validateBody(finalizeEntrySchema),
    controller.handleFinalizeEntry,
  );

  // Non-scoped routes
  router.get(
    '/ledger',
    requireAuthGuard,
    validateQuery(ledgerFilterSchema.extend({ status: z.enum(['billed', 'unbilled']).optional() })),
    async (req, res) => {
      const status = (req.query as Record<string, string>).status;
      if (status === 'unbilled') {
        return controller.handleGetUnbilledEntries(req as any, res);
      }
      return controller.handleGetBilledEntries(req as any, res);
    },
  );

  router.get('/ledger/export', requireAuthGuard, async (_req, res) => {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ledger-export.csv"');
    res.status(200).send('date,description,amount,status\n');
  });

  router.get('/ledger/health', controller.handleGetHealth);
  router.get('/ledger/metrics', controller.handleGetMetrics);

  return router;
}
