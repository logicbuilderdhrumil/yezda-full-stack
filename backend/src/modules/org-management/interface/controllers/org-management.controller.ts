/**
 * Org Management Controller
 *
 * Thin HTTP adapter — delegates to use cases via constructor-injected dependencies.
 */
import type { Request, Response } from 'express';
import type { ListOrganizationsUseCase } from '../../application/use-cases/ListOrganizationsUseCase.js';
import type { GetOrganizationByIdUseCase } from '../../application/use-cases/GetOrganizationByIdUseCase.js';
import type { CreateOrganizationUseCase } from '../../application/use-cases/CreateOrganizationUseCase.js';
import type { UpdateOrganizationUseCase } from '../../application/use-cases/UpdateOrganizationUseCase.js';
import type { UpdateOrganizationStatusUseCase } from '../../application/use-cases/UpdateOrganizationStatusUseCase.js';
import type { DeleteOrganizationUseCase } from '../../application/use-cases/DeleteOrganizationUseCase.js';
import type { SendOrgMemberInviteUseCase } from '../../../email/application/use-cases/SendOrgMemberInviteUseCase.js';
import type { InviteContext } from '../../../email/domain/types/email-types.js';
import type {
  OrgContext,
  OrgFilters,
  OrgPaginationOptions,
  OrganizationStatus,
  OrganizationPlan,
  CreateOrgDto,
  UpdateOrgDto,
} from '../../domain/index.js';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    type: 'user' | 'candidate';
    tenantId?: string;
    roles?: string[];
  };
}

function buildContext(req: AuthenticatedRequest): OrgContext {
  if (!req.user?.tenantId) {
    throw new Error('Tenant context required');
  }
  return {
    actorId: req.user.sub,
    actorType: req.user.type,
    actorRoles: req.user.roles ?? [],
    tenantId: req.user.tenantId,
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    channel: (req.get('x-channel') || 'api') as 'web' | 'mobile' | 'api',
  };
}

export class OrgManagementController {
  constructor(
    private readonly listOrgsUC: ListOrganizationsUseCase,
    private readonly getOrgByIdUC: GetOrganizationByIdUseCase,
    private readonly createOrgUC: CreateOrganizationUseCase,
    private readonly updateOrgUC: UpdateOrganizationUseCase,
    private readonly updateOrgStatusUC: UpdateOrganizationStatusUseCase,
    private readonly deleteOrgUC: DeleteOrganizationUseCase,
    private readonly sendOrgMemberInviteUC?: SendOrgMemberInviteUseCase,
  ) {}

  listOrganizations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let ctx: OrgContext;
    try { ctx = buildContext(req); } catch (err) {
      res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
      return;
    }

    const filters: OrgFilters = {
      status: req.query.status as OrganizationStatus | undefined,
      plan: req.query.plan as OrganizationPlan | undefined,
      search: req.query.search as string | undefined,
    };

    const pagination: OrgPaginationOptions = {
      sortBy: req.query.sortBy as OrgPaginationOptions['sortBy'],
      sortOrder: req.query.sortOrder as OrgPaginationOptions['sortOrder'],
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      offset: req.query.offset ? Number(req.query.offset) : undefined,
    };

    const result = await this.listOrgsUC.execute(ctx, filters, pagination);
    if (!result.success) {
      res.status(500).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(200).json(result.data);
  };

  getOrganizationById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let ctx: OrgContext;
    try { ctx = buildContext(req); } catch (err) {
      res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
      return;
    }

    const { id } = req.params;
    const result = await this.getOrgByIdUC.execute(ctx, id);
    if (!result.success) {
      const status = result.errorCode === 'ORG_NOT_FOUND' ? 404 : 500;
      res.status(status).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(200).json(result.data);
  };

  createOrganization = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let ctx: OrgContext;
    try { ctx = buildContext(req); } catch (err) {
      res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
      return;
    }

    const dto = req.body as CreateOrgDto;
    const result = await this.createOrgUC.execute(ctx, dto);
    if (!result.success) {
      const status = result.errorCode === 'ORG_SLUG_EXISTS' ? 409 : 500;
      res.status(status).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(201).json(result.data);
  };

  updateOrganization = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let ctx: OrgContext;
    try { ctx = buildContext(req); } catch (err) {
      res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
      return;
    }

    const { id } = req.params;
    const dto = req.body as UpdateOrgDto;
    const result = await this.updateOrgUC.execute(ctx, id, dto);
    if (!result.success) {
      const status = result.errorCode === 'ORG_NOT_FOUND' ? 404 : 500;
      res.status(status).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(200).json(result.data);
  };

  updateOrganizationStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let ctx: OrgContext;
    try { ctx = buildContext(req); } catch (err) {
      res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body as { status: OrganizationStatus };
    const result = await this.updateOrgStatusUC.execute(ctx, id, status);
    if (!result.success) {
      const httpStatus = result.errorCode === 'ORG_NOT_FOUND' ? 404 : 500;
      res.status(httpStatus).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(200).json(result.data);
  };

  deleteOrganization = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let ctx: OrgContext;
    try { ctx = buildContext(req); } catch (err) {
      res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
      return;
    }

    const { id } = req.params;
    const result = await this.deleteOrgUC.execute(ctx, id);
    if (!result.success) {
      const status = result.errorCode === 'ORG_NOT_FOUND' ? 404 : 500;
      res.status(status).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(204).send();
  };

  inviteMember = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    if (!this.sendOrgMemberInviteUC) {
      res.status(501).json({ error: 'Email invite module not configured', code: 'NOT_CONFIGURED' });
      return;
    }

    if (!req.user) {
      res.status(401).json({ error: 'Authentication required', code: 'UNAUTHORIZED' });
      return;
    }

    const orgId = req.params.id;
    if (!orgId) {
      res.status(400).json({ error: 'Organization ID is required', code: 'MISSING_ORG_ID' });
      return;
    }

    const inviteCtx: InviteContext = {
      actorId: req.user.sub,
      actorType: 'user',
      tenantId: orgId,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    const { email, role, orgName, inviterName } = req.body;
    const result = await this.sendOrgMemberInviteUC.execute(inviteCtx, {
      email,
      role,
      orgName,
      inviterName,
    });

    if (!result.success) {
      const status = result.errorCode === 'INVITE_RATE_LIMITED' ? 429 : 500;
      res.status(status).json({ error: result.error, code: result.errorCode });
      return;
    }

    res.status(201).json({ success: true, expiresAt: result.expiresAt });
  };
}
