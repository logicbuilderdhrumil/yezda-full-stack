/**
 * Billing Ledger Routes
 * Task 1.2, 1.3, 1.7: Ledger API endpoints with rate limiting
 */

import { Router } from 'express';
import * as billingLedgerController from '../controllers/billing-ledger.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import {
  billedLedgerRateLimiter,
  unbilledLedgerRateLimiter,
} from '../middleware/billing-ledger-rate-limit.middleware.js';
import { validateBody, validateQuery } from '../middleware/validation.middleware.js';
import { z } from 'zod';

const router = Router();

// Validation schemas
const ledgerFilterSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  entryTypes: z.string().optional(), // Comma-separated list
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
  entryType: z.enum([
    'screening',
    'verification',
    'document_review',
    'subscription',
    'addon',
    'adjustment',
    'credit',
  ]),
  description: z.string().min(1).max(500),
  quantity: z.number().int().positive(),
  unitPrice: z.number().int().min(0), // In cents
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

// Organization-scoped ledger endpoints
// GET /api/v1/organizations/:organizationId/ledger/billed
router.get(
  '/organizations/:organizationId/ledger/billed',
  requireAuth,
  billedLedgerRateLimiter,
  validateQuery(ledgerFilterSchema),
  billingLedgerController.getBilledEntries
);

// GET /api/v1/organizations/:organizationId/ledger/unbilled
router.get(
  '/organizations/:organizationId/ledger/unbilled',
  requireAuth,
  unbilledLedgerRateLimiter,
  validateQuery(ledgerFilterSchema),
  billingLedgerController.getUnbilledEntries
);

// POST /api/v1/organizations/:organizationId/ledger/entries
router.post(
  '/organizations/:organizationId/ledger/entries',
  requireAuth,
  validateBody(createEntrySchema),
  billingLedgerController.createEntry
);

// PATCH /api/v1/organizations/:organizationId/ledger/entries/:entryId
router.patch(
  '/organizations/:organizationId/ledger/entries/:entryId',
  requireAuth,
  validateBody(updateEntrySchema),
  billingLedgerController.updateEntry
);

// POST /api/v1/organizations/:organizationId/ledger/entries/:entryId/finalize
router.post(
  '/organizations/:organizationId/ledger/entries/:entryId/finalize',
  requireAuth,
  validateBody(finalizeEntrySchema),
  billingLedgerController.finalizeEntry
);

// Non-organization-scoped ledger list (uses default org from tenant header)
// GET /api/v1/ledger?status=billed|unbilled
router.get(
  '/ledger',
  requireAuth,
  validateQuery(ledgerFilterSchema.extend({ status: z.enum(['billed', 'unbilled']).optional() })),
  async (req, res) => {
    const status = (req.query as Record<string, string>).status;
    if (status === 'unbilled') {
      return billingLedgerController.getUnbilledEntries(req as any, res);
    }
    return billingLedgerController.getBilledEntries(req as any, res);
  }
);

// Non-organization-scoped ledger export
// GET /api/v1/ledger/export?format=csv
router.get(
  '/ledger/export',
  requireAuth,
  async (req, res) => {
    // Return empty CSV for now - placeholder for future implementation
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ledger-export.csv"');
    res.status(200).send('date,description,amount,status\n');
  }
);

// Health and metrics endpoints (not organization-scoped)
router.get('/ledger/health', billingLedgerController.getHealthSummary);
router.get('/ledger/metrics', billingLedgerController.getMetrics);

export default router;
