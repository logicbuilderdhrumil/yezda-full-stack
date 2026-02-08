/**
 * User Management Controller
 *
 * Thin HTTP adapter — delegates to use cases via constructor-injected dependencies.
 */
import type { Request, Response } from 'express';
import type { ListUsersUseCase } from '../../application/use-cases/ListUsersUseCase.js';
import type { GetUserByIdUseCase } from '../../application/use-cases/GetUserByIdUseCase.js';
import type { CreateUserUseCase } from '../../application/use-cases/CreateUserUseCase.js';
import type { UpdateUserUseCase } from '../../application/use-cases/UpdateUserUseCase.js';
import type { UpdateUserStatusUseCase } from '../../application/use-cases/UpdateUserStatusUseCase.js';
import type { UpdateUserRolesUseCase } from '../../application/use-cases/UpdateUserRolesUseCase.js';
import type { DeleteUserUseCase } from '../../application/use-cases/DeleteUserUseCase.js';
import type { UserManagementContext, CreateUserDto, UpdateUserDto, UserSearchParams, UserStatus, UserRole } from '../../domain/index.js';

interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    type: 'user' | 'candidate';
    tenantId?: string;
    roles?: string[];
  };
}

function buildContext(req: AuthenticatedRequest): UserManagementContext {
  if (!req.user?.tenantId) {
    throw new Error('Tenant context required');
  }
  return {
    actorId: req.user.sub,
    actorType: req.user.type,
    actorRoles: (req.user.roles ?? []) as UserRole[],
    tenantId: req.user.tenantId,
    ipAddress: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    channel: (req.get('x-channel') || 'api') as 'web' | 'mobile' | 'api',
  };
}

export class UserManagementController {
  constructor(
    private readonly listUsersUC: ListUsersUseCase,
    private readonly getUserByIdUC: GetUserByIdUseCase,
    private readonly createUserUC: CreateUserUseCase,
    private readonly updateUserUC: UpdateUserUseCase,
    private readonly updateUserStatusUC: UpdateUserStatusUseCase,
    private readonly updateUserRolesUC: UpdateUserRolesUseCase,
    private readonly deleteUserUC: DeleteUserUseCase,
  ) {}

  listUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let ctx: UserManagementContext;
    try { ctx = buildContext(req); } catch {
      res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
      return;
    }
    const params: Omit<UserSearchParams, 'tenantId'> = {
      query: req.query.q as string | undefined,
      status: req.query.status as UserStatus | undefined,
      role: req.query.role as UserRole | undefined,
      page: req.query.page ? Number(req.query.page) : undefined,
      limit: req.query.limit ? Number(req.query.limit) : undefined,
      sortBy: req.query.sortBy as UserSearchParams['sortBy'],
      sortOrder: req.query.sortOrder as UserSearchParams['sortOrder'],
    };
    const result = await this.listUsersUC.execute(ctx, params);
    if (!result.success) {
      const status = result.errorCode === 'FORBIDDEN' ? 403 : 500;
      res.status(status).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(200).json(result.data);
  };

  createUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let ctx: UserManagementContext;
    try { ctx = buildContext(req); } catch {
      res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
      return;
    }
    const dto = req.body as CreateUserDto;
    const result = await this.createUserUC.execute(ctx, dto);
    if (!result.success) {
      let status = 500;
      if (result.errorCode === 'FORBIDDEN') status = 403;
      else if (result.errorCode === 'EMAIL_EXISTS') status = 409;
      res.status(status).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(201).json(result.data);
  };

  getUserById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let ctx: UserManagementContext;
    try { ctx = buildContext(req); } catch {
      res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
      return;
    }
    const { id } = req.params;
    const result = await this.getUserByIdUC.execute(ctx, id);
    if (!result.success) {
      let status = 500;
      if (result.errorCode === 'NOT_FOUND') status = 404;
      else if (result.errorCode === 'FORBIDDEN') status = 403;
      res.status(status).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(200).json(result.data);
  };

  updateUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let ctx: UserManagementContext;
    try { ctx = buildContext(req); } catch {
      res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
      return;
    }
    const { id } = req.params;
    const dto = req.body as UpdateUserDto;
    const result = await this.updateUserUC.execute(ctx, id, dto);
    if (!result.success) {
      let status = 500;
      if (result.errorCode === 'NOT_FOUND') status = 404;
      else if (result.errorCode === 'FORBIDDEN') status = 403;
      res.status(status).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(200).json(result.data);
  };

  updateUserStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let ctx: UserManagementContext;
    try { ctx = buildContext(req); } catch {
      res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
      return;
    }
    const { id } = req.params;
    const { status } = req.body as { status: UserStatus };
    const result = await this.updateUserStatusUC.execute(ctx, id, status);
    if (!result.success) {
      let httpStatus = 500;
      if (result.errorCode === 'NOT_FOUND') httpStatus = 404;
      else if (result.errorCode === 'FORBIDDEN') httpStatus = 403;
      res.status(httpStatus).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(200).json(result.data);
  };

  updateUserRoles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let ctx: UserManagementContext;
    try { ctx = buildContext(req); } catch {
      res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
      return;
    }
    const { id } = req.params;
    const { roles } = req.body as { roles: UserRole[] };
    const result = await this.updateUserRolesUC.execute(ctx, id, roles);
    if (!result.success) {
      let status = 500;
      if (result.errorCode === 'NOT_FOUND') status = 404;
      else if (result.errorCode === 'FORBIDDEN') status = 403;
      res.status(status).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(200).json(result.data);
  };

  deleteUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    let ctx: UserManagementContext;
    try { ctx = buildContext(req); } catch {
      res.status(401).json({ error: 'Tenant context required', code: 'UNAUTHORIZED' });
      return;
    }
    const { id } = req.params;
    const result = await this.deleteUserUC.execute(ctx, id);
    if (!result.success) {
      let status = 500;
      if (result.errorCode === 'NOT_FOUND') status = 404;
      else if (result.errorCode === 'FORBIDDEN') status = 403;
      else if (result.errorCode === 'SELF_DELETE_FORBIDDEN') status = 400;
      res.status(status).json({ error: result.error, code: result.errorCode });
      return;
    }
    res.status(204).send();
  };
}
