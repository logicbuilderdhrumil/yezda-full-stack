/**
 * Billing Ledger Controller
 * Task 1.2, 1.3: Billed and unbilled ledger endpoint handlers
 */

import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { billingLedgerService } from '../services/billing-ledger.service.js';
import { billingLedgerMetricsService } from '../services/billing-ledger-metrics.service.js';
import type { LedgerFilterOptions, LedgerEntryType } from '../models/billing-ledger.model.js';

/**
 * Get client info from request
 */
function getClientInfo(req: AuthenticatedRequest) {
  return {
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    channel: (req.get('x-channel') || 'api') as 'web' | 'mobile' | 'api',
  };
}

/**
 * Extract tenant ID from request
 */
function getTenantId(req: AuthenticatedRequest): string {
  return req.user?.tenantId || req.get('x-tenant-id') || 'default';
}

/**
 * Extract organization ID from request params or headers
 */
function getOrganizationId(req: AuthenticatedRequest): string {
  return req.params.organizationId || req.get('x-organization-id') || 'default';
}

/**
 * Extract user roles from request (from JWT claims or headers)
 */
function getUserRoles(req: AuthenticatedRequest): string[] {
  // In production, roles would come from JWT claims
  const rolesHeader = req.get('x-user-roles');
  if (rolesHeader) {
    return rolesHeader.split(',').map((r) => r.trim());
  }
  // System-level users (from users table, type=user) get system_admin role by default
  if (req.user?.type === 'user') {
    return ['system_admin'];
  }
  // Default to empty roles if not provided
  return [];
}

/**
 * Parse filter options from query parameters
 */
function parseFilters(query: Record<string, unknown>): LedgerFilterOptions {
  const filters: LedgerFilterOptions = {};

  if (query.startDate && typeof query.startDate === 'string') {
    filters.startDate = new Date(query.startDate);
  }
  if (query.endDate && typeof query.endDate === 'string') {
    filters.endDate = new Date(query.endDate);
  }
  if (query.entryTypes && typeof query.entryTypes === 'string') {
    filters.entryTypes = query.entryTypes.split(',') as LedgerEntryType[];
  }
  if (query.minAmount && typeof query.minAmount === 'string') {
    filters.minAmount = parseInt(query.minAmount, 10);
  }
  if (query.maxAmount && typeof query.maxAmount === 'string') {
    filters.maxAmount = parseInt(query.maxAmount, 10);
  }
  if (query.invoiceId && typeof query.invoiceId === 'string') {
    filters.invoiceId = query.invoiceId;
  }
  if (query.referenceId && typeof query.referenceId === 'string') {
    filters.referenceId = query.referenceId;
  }
  if (query.referenceType && typeof query.referenceType === 'string') {
    filters.referenceType = query.referenceType;
  }
  if (query.page && typeof query.page === 'string') {
    filters.page = parseInt(query.page, 10);
  }
  if (query.pageSize && typeof query.pageSize === 'string') {
    filters.pageSize = parseInt(query.pageSize, 10);
  }
  if (query.sortBy && typeof query.sortBy === 'string') {
    filters.sortBy = query.sortBy as 'createdAt' | 'totalAmount' | 'billedAt';
  }
  if (query.sortOrder && typeof query.sortOrder === 'string') {
    filters.sortOrder = query.sortOrder as 'asc' | 'desc';
  }

  return filters;
}

/**
 * GET /api/v1/organizations/:organizationId/ledger/billed
 * Get billed ledger entries with filters and totals
 * Task 1.2: Billed ledger list endpoint
 */
export async function getBilledEntries(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { ipAddress, channel } = getClientInfo(req);
  const tenantId = getTenantId(req);
  const organizationId = getOrganizationId(req);
  const userRoles = getUserRoles(req);
  const filters = parseFilters(req.query as Record<string, unknown>);

  const result = await billingLedgerService.getBilledEntries(
    tenantId,
    organizationId,
    filters,
    req.user.sub,
    userRoles,
    channel,
    ipAddress
  );

  if (!result.success) {
    const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * GET /api/v1/organizations/:organizationId/ledger/unbilled
 * Get unbilled ledger entries with filters and totals
 * Task 1.3: Unbilled ledger list endpoint
 */
export async function getUnbilledEntries(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { ipAddress, channel } = getClientInfo(req);
  const tenantId = getTenantId(req);
  const organizationId = getOrganizationId(req);
  const userRoles = getUserRoles(req);
  const filters = parseFilters(req.query as Record<string, unknown>);

  const result = await billingLedgerService.getUnbilledEntries(
    tenantId,
    organizationId,
    filters,
    req.user.sub,
    userRoles,
    channel,
    ipAddress
  );

  if (!result.success) {
    const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.data);
}

/**
 * POST /api/v1/organizations/:organizationId/ledger/entries
 * Create a new ledger entry
 */
export async function createEntry(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { ipAddress, channel } = getClientInfo(req);
  const tenantId = getTenantId(req);
  const organizationId = getOrganizationId(req);
  const userRoles = getUserRoles(req);

  const result = await billingLedgerService.createEntry(
    tenantId,
    organizationId,
    req.body,
    req.user.sub,
    req.user.type,
    userRoles,
    channel,
    ipAddress
  );

  if (!result.success) {
    const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 400;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(201).json(result.entry);
}

/**
 * PATCH /api/v1/organizations/:organizationId/ledger/entries/:entryId
 * Update a ledger entry (will fail if finalized)
 */
export async function updateEntry(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { ipAddress, channel } = getClientInfo(req);
  const tenantId = getTenantId(req);
  const organizationId = getOrganizationId(req);
  const entryId = req.params.entryId;
  const userRoles = getUserRoles(req);

  const result = await billingLedgerService.updateEntry(
    tenantId,
    organizationId,
    entryId,
    req.body,
    req.user.sub,
    userRoles,
    channel,
    ipAddress
  );

  if (!result.success) {
    const statusCode =
      result.errorCode === 'FORBIDDEN'
        ? 403
        : result.errorCode === 'IMMUTABLE_ENTRY'
        ? 409
        : 400;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.entry);
}

/**
 * POST /api/v1/organizations/:organizationId/ledger/entries/:entryId/finalize
 * Finalize a ledger entry (mark as billed and immutable)
 */
export async function finalizeEntry(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
    return;
  }

  const { ipAddress, channel } = getClientInfo(req);
  const tenantId = getTenantId(req);
  const organizationId = getOrganizationId(req);
  const entryId = req.params.entryId;
  const userRoles = getUserRoles(req);
  const { invoiceId } = req.body;

  if (!invoiceId) {
    res.status(400).json({ error: 'Invoice ID is required', code: 'MISSING_INVOICE_ID' });
    return;
  }

  const result = await billingLedgerService.finalizeEntry(
    tenantId,
    organizationId,
    entryId,
    invoiceId,
    req.user.sub,
    userRoles,
    channel,
    ipAddress
  );

  if (!result.success) {
    const statusCode =
      result.errorCode === 'FORBIDDEN'
        ? 403
        : result.errorCode === 'NOT_FOUND'
        ? 404
        : 400;
    res.status(statusCode).json({ error: result.error, code: result.errorCode });
    return;
  }

  res.status(200).json(result.entry);
}

/**
 * GET /api/v1/ledger/health
 * Get billing ledger health and SLO status
 * Task 1.8: SLO monitoring endpoint
 */
export async function getHealthSummary(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const health = billingLedgerMetricsService.getHealthSummary();
  const sloCheck = billingLedgerMetricsService.checkSLOs();

  res.status(200).json({
    status: sloCheck.met ? 'healthy' : 'degraded',
    ...health,
  });
}

/**
 * GET /api/v1/ledger/metrics
 * Get billing ledger metrics in Prometheus format
 * Task 1.8: Metrics export
 */
export async function getMetrics(
  _req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  const metrics = billingLedgerMetricsService.exportMetrics();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.status(200).send(metrics);
}
