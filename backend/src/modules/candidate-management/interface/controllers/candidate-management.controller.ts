/**
 * Candidate Management Controller
 * Interface layer — HTTP request handlers with constructor-injected use cases.
 */

import type { Request, Response } from 'express';
import { getClientIp } from '../../../../shared/infrastructure/utils/index.js';
import type { AuthenticatedRoleRequest, UserRole } from '../../../../shared/infrastructure/middleware/index.js';
import type {
  CandidateSearchParams,
  CandidateStatus,
  CandidateManagementContext,
} from '../../domain/entities/candidate.entity.js';
import type { ListCandidatesUseCase } from '../../application/use-cases/ListCandidatesUseCase.js';
import type { GetCandidateByIdUseCase } from '../../application/use-cases/GetCandidateByIdUseCase.js';
import type { CreateCandidateUseCase } from '../../application/use-cases/CreateCandidateUseCase.js';
import type { UpdateCandidateUseCase } from '../../application/use-cases/UpdateCandidateUseCase.js';
import type { UpdateCandidateStatusUseCase } from '../../application/use-cases/UpdateCandidateStatusUseCase.js';
import type { BulkCreateCandidatesUseCase } from '../../application/use-cases/BulkCreateCandidatesUseCase.js';
import type { SubmitCandidateFormUseCase } from '../../application/use-cases/SubmitCandidateFormUseCase.js';
import type { DeleteCandidateUseCase } from '../../application/use-cases/DeleteCandidateUseCase.js';

function getManagementContext(req: AuthenticatedRoleRequest): CandidateManagementContext {
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'];
  const tenantId = req.user?.tenantId || (req.headers['x-tenant-id'] as string) || '';

  return {
    actorId: req.user?.sub || '',
    actorType: (req.user?.type || 'user') as 'user' | 'candidate',
    actorRoles: (req.user?.roles || []) as UserRole[],
    tenantId,
    ipAddress: ip,
    userAgent,
    channel: 'api' as const,
  };
}

export class CandidateManagementController {
  constructor(
    private readonly listCandidatesUseCase: ListCandidatesUseCase,
    private readonly getCandidateByIdUseCase: GetCandidateByIdUseCase,
    private readonly createCandidateUseCase: CreateCandidateUseCase,
    private readonly updateCandidateUseCase: UpdateCandidateUseCase,
    private readonly updateCandidateStatusUseCase: UpdateCandidateStatusUseCase,
    private readonly bulkCreateCandidatesUseCase: BulkCreateCandidatesUseCase,
    private readonly submitCandidateFormUseCase: SubmitCandidateFormUseCase,
    private readonly deleteCandidateUseCase: DeleteCandidateUseCase,
  ) {}

  listCandidates = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    const ctx = getManagementContext(req);

    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
      return;
    }

    const params: Omit<CandidateSearchParams, 'tenantId'> = {
      query: req.query.q as string | undefined,
      status: req.query.status as CandidateStatus | undefined,
      certified: req.query.certified !== undefined ? req.query.certified === 'true' : undefined,
      archived: req.query.archived !== undefined ? req.query.archived === 'true' : undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      sortBy: req.query.sortBy as CandidateSearchParams['sortBy'],
      sortOrder: req.query.sortOrder as CandidateSearchParams['sortOrder'],
    };

    const result = await this.listCandidatesUseCase.execute(params, ctx);

    if (!result.success) {
      const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
      res.status(statusCode).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(200).json(result.data);
  };

  getCandidateById = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    const ctx = getManagementContext(req);
    const { id } = req.params;

    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
      return;
    }

    const result = await this.getCandidateByIdUseCase.execute(id, ctx);

    if (!result.success) {
      const statusCode =
        result.errorCode === 'FORBIDDEN' ? 403 :
        result.errorCode === 'NOT_FOUND' ? 404 : 500;
      res.status(statusCode).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(200).json(result.data);
  };

  createCandidate = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    const ctx = getManagementContext(req);

    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
      return;
    }

    const { email, firstName, lastName, phone, status, metadata } = req.body;

    const result = await this.createCandidateUseCase.execute(
      { email, firstName, lastName, phone, status, metadata },
      ctx,
    );

    if (!result.success) {
      const statusCode =
        result.errorCode === 'FORBIDDEN' ? 403 :
        result.errorCode === 'EMAIL_EXISTS' ? 409 : 500;
      res.status(statusCode).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(201).json(result.data);
  };

  updateCandidate = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    const ctx = getManagementContext(req);
    const { id } = req.params;

    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
      return;
    }

    const { firstName, lastName, phone, status, metadata } = req.body;

    const result = await this.updateCandidateUseCase.execute(
      id,
      { firstName, lastName, phone, status, metadata },
      ctx,
    );

    if (!result.success) {
      const statusCode =
        result.errorCode === 'FORBIDDEN' ? 403 :
        result.errorCode === 'NOT_FOUND' ? 404 : 500;
      res.status(statusCode).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(200).json(result.data);
  };

  updateCandidateStatus = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    const ctx = getManagementContext(req);
    const { id } = req.params;
    const { status } = req.body;

    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
      return;
    }

    const result = await this.updateCandidateStatusUseCase.execute(id, status, ctx);

    if (!result.success) {
      const statusCode =
        result.errorCode === 'FORBIDDEN' ? 403 :
        result.errorCode === 'NOT_FOUND' ? 404 : 500;
      res.status(statusCode).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(200).json(result.data);
  };

  bulkCreateCandidates = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    const ctx = getManagementContext(req);

    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
      return;
    }

    const { candidates } = req.body;

    const result = await this.bulkCreateCandidatesUseCase.execute(candidates, ctx);

    if (!result.success) {
      const statusCode = result.errorCode === 'FORBIDDEN' ? 403 : 500;
      res.status(statusCode).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(201).json(result.data);
  };

  submitCandidateForm = async (req: Request, res: Response): Promise<void> => {
    const { tenantId } = req.params;
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'];

    const { email, firstName, lastName, phone, consentGiven, metadata } = req.body;

    const result = await this.submitCandidateFormUseCase.execute(
      tenantId,
      { email, firstName, lastName, phone, consentGiven, metadata },
      ip,
      userAgent,
    );

    if (!result.success) {
      const statusCode =
        result.errorCode === 'INVALID_TENANT' ? 400 :
        result.errorCode === 'EMAIL_EXISTS' ? 409 : 500;
      res.status(statusCode).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(201).json(result.data);
  };

  deleteCandidate = async (req: AuthenticatedRoleRequest, res: Response): Promise<void> => {
    const ctx = getManagementContext(req);
    const { id } = req.params;

    if (!ctx.tenantId) {
      res.status(400).json({ error: 'Tenant ID is required', code: 'MISSING_TENANT' });
      return;
    }

    const result = await this.deleteCandidateUseCase.execute(id, ctx);

    if (!result.success) {
      const statusCode =
        result.errorCode === 'FORBIDDEN' ? 403 :
        result.errorCode === 'NOT_FOUND' ? 404 : 500;
      res.status(statusCode).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(204).send();
  };
}
