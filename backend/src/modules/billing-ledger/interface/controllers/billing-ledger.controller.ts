/**
 * BillingLedgerController — Clean Architecture interface adapter
 */
import type { Request, Response } from 'express';
import type { GetBilledEntriesUseCase } from '../../application/use-cases/GetBilledEntriesUseCase.js';
import type { GetUnbilledEntriesUseCase } from '../../application/use-cases/GetUnbilledEntriesUseCase.js';
import type { CreateEntryUseCase } from '../../application/use-cases/CreateEntryUseCase.js';
import type { UpdateEntryUseCase } from '../../application/use-cases/UpdateEntryUseCase.js';
import type { FinalizeEntryUseCase } from '../../application/use-cases/FinalizeEntryUseCase.js';
import type { GetHealthUseCase, GetMetricsUseCase } from '../../application/use-cases/GetHealthUseCase.js';
import type { LedgerFilterOptions, LedgerEntryType, RequestContext } from '../../domain/entities/ledger.entity.js';

interface AuthenticatedRequest extends Request {
  user?: { sub: string; type: 'user' | 'candidate'; tenantId?: string };
}

function getCtx(req: AuthenticatedRequest): RequestContext {
  return {
    userId: req.user!.sub,
    userType: req.user!.type,
    tenantId: req.user?.tenantId || req.get('x-tenant-id') || 'default',
    ipAddress: req.ip || req.socket.remoteAddress,
    channel: (req.get('x-channel') || 'api') as 'web' | 'mobile' | 'api',
  };
}

function getOrgId(req: AuthenticatedRequest): string {
  return req.params.organizationId || req.get('x-organization-id') || 'default';
}

function getUserRoles(req: AuthenticatedRequest): string[] {
  const rolesHeader = req.get('x-user-roles');
  if (rolesHeader) return rolesHeader.split(',').map((r) => r.trim());
  if (req.user?.type === 'user') return ['system_admin'];
  return [];
}

function parseFilters(queryParams: Record<string, unknown>): LedgerFilterOptions {
  const filters: LedgerFilterOptions = {};
  if (queryParams.startDate && typeof queryParams.startDate === 'string') filters.startDate = new Date(queryParams.startDate);
  if (queryParams.endDate && typeof queryParams.endDate === 'string') filters.endDate = new Date(queryParams.endDate);
  if (queryParams.entryTypes && typeof queryParams.entryTypes === 'string') filters.entryTypes = queryParams.entryTypes.split(',') as LedgerEntryType[];
  if (queryParams.minAmount && typeof queryParams.minAmount === 'string') filters.minAmount = parseInt(queryParams.minAmount, 10);
  if (queryParams.maxAmount && typeof queryParams.maxAmount === 'string') filters.maxAmount = parseInt(queryParams.maxAmount, 10);
  if (queryParams.invoiceId && typeof queryParams.invoiceId === 'string') filters.invoiceId = queryParams.invoiceId;
  if (queryParams.referenceId && typeof queryParams.referenceId === 'string') filters.referenceId = queryParams.referenceId;
  if (queryParams.referenceType && typeof queryParams.referenceType === 'string') filters.referenceType = queryParams.referenceType;
  if (queryParams.page && typeof queryParams.page === 'string') filters.page = parseInt(queryParams.page, 10);
  if (queryParams.pageSize && typeof queryParams.pageSize === 'string') filters.pageSize = parseInt(queryParams.pageSize, 10);
  if (queryParams.sortBy && typeof queryParams.sortBy === 'string') filters.sortBy = queryParams.sortBy as 'createdAt' | 'totalAmount' | 'billedAt';
  if (queryParams.sortOrder && typeof queryParams.sortOrder === 'string') filters.sortOrder = queryParams.sortOrder as 'asc' | 'desc';
  return filters;
}

export class BillingLedgerController {
  constructor(
    private readonly getBilledEntries: GetBilledEntriesUseCase,
    private readonly getUnbilledEntries: GetUnbilledEntriesUseCase,
    private readonly createEntry: CreateEntryUseCase,
    private readonly updateEntry: UpdateEntryUseCase,
    private readonly finalizeEntry: FinalizeEntryUseCase,
    private readonly getHealth: GetHealthUseCase,
    private readonly getMetrics: GetMetricsUseCase,
  ) {}

  handleGetBilledEntries = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' }); return; }
    const ctx = getCtx(req);
    const result = await this.getBilledEntries.execute(ctx, getOrgId(req), parseFilters(req.query as Record<string, unknown>), getUserRoles(req));
    if (!result.success) { res.status(result.code === 'FORBIDDEN' ? 403 : 500).json({ error: result.error, code: result.code }); return; }
    res.status(200).json(result.data);
  };

  handleGetUnbilledEntries = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' }); return; }
    const ctx = getCtx(req);
    const result = await this.getUnbilledEntries.execute(ctx, getOrgId(req), parseFilters(req.query as Record<string, unknown>), getUserRoles(req));
    if (!result.success) { res.status(result.code === 'FORBIDDEN' ? 403 : 500).json({ error: result.error, code: result.code }); return; }
    res.status(200).json(result.data);
  };

  handleCreateEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' }); return; }
    const ctx = getCtx(req);
    const result = await this.createEntry.execute(ctx, getOrgId(req), req.body, getUserRoles(req));
    if (!result.success) { res.status(result.code === 'FORBIDDEN' ? 403 : 400).json({ error: result.error, code: result.code }); return; }
    res.status(201).json(result.data);
  };

  handleUpdateEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' }); return; }
    const ctx = getCtx(req);
    const result = await this.updateEntry.execute(ctx, getOrgId(req), req.params.entryId, req.body, getUserRoles(req));
    if (!result.success) {
      const statusCode = result.code === 'FORBIDDEN' ? 403 : result.code === 'IMMUTABLE_ENTRY' ? 409 : 400;
      res.status(statusCode).json({ error: result.error, code: result.code });
      return;
    }
    res.status(200).json(result.data);
  };

  handleFinalizeEntry = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!req.user) { res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' }); return; }
    const { invoiceId } = req.body;
    if (!invoiceId) { res.status(400).json({ error: 'Invoice ID is required', code: 'MISSING_INVOICE_ID' }); return; }
    const ctx = getCtx(req);
    const result = await this.finalizeEntry.execute(ctx, getOrgId(req), req.params.entryId, invoiceId, getUserRoles(req));
    if (!result.success) {
      const statusCode = result.code === 'FORBIDDEN' ? 403 : result.code === 'NOT_FOUND' ? 404 : 400;
      res.status(statusCode).json({ error: result.error, code: result.code });
      return;
    }
    res.status(200).json(result.data);
  };

  handleGetHealth = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.status(200).json(this.getHealth.execute());
  };

  handleGetMetrics = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(this.getMetrics.execute());
  };
}
