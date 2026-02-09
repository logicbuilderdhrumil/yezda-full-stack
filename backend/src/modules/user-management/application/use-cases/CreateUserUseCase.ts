/**
 * Create User Use Case
 */
import { v4 as uuidv4 } from 'uuid';
import type {
  IUserManagementRepository,
  IAuditService,
  IMetricsService,
  IPasswordService,
  IUserAuthRepository,
  ManagedUser,
  UserManagementResult,
  UserManagementContext,
  CreateUserDto,
} from '../../domain/index.js';
import { canManageUsers, canAssignRole } from '../../domain/index.js';

export class CreateUserUseCase {
  constructor(
    private readonly repo: IUserManagementRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
    private readonly passwordService: IPasswordService,
    private readonly userAuthRepo: IUserAuthRepository,
  ) {}

  async execute(ctx: UserManagementContext, dto: CreateUserDto): Promise<UserManagementResult<ManagedUser>> {
    const startTime = Date.now();

    // Check permissions
    if (!canManageUsers(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'create', 'Insufficient permissions');
      return { success: false, error: 'Insufficient permissions to create users', errorCode: 'FORBIDDEN' };
    }

    // Check if actor can assign requested roles
    for (const role of dto.roles) {
      if (!canAssignRole(ctx.actorRoles, role)) {
        this.logAccessDenied(ctx, 'create', `Cannot assign role: ${role}`);
        return { success: false, error: `Insufficient permissions to assign role: ${role}`, errorCode: 'FORBIDDEN' };
      }
    }

    try {
      // Check if email already exists in this tenant
      const emailExists = await this.repo.emailExists(dto.email, ctx.tenantId);
      if (emailExists) {
        return { success: false, error: 'Email already exists in this organization', errorCode: 'EMAIL_EXISTS' };
      }

      // Hash password if provided
      let passwordHash: string | undefined;
      if (dto.password) {
        passwordHash = await this.passwordService.hash(dto.password);
      }

      const userId = uuidv4();
      const now = new Date();

      // Also create an auth record so the user can sign in
      if (passwordHash) {
        const authEmailExists = await this.userAuthRepo.emailExistsForUser(dto.email);
        if (!authEmailExists) {
          await this.userAuthRepo.createUser({
            id: userId,
            email: dto.email.toLowerCase().trim(),
            passwordHash,
            mfaEnabled: false,
            failedAttempts: 0,
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      const user = await this.repo.create({
        ...dto,
        id: userId,
        tenantId: ctx.tenantId,
        createdBy: ctx.actorId,
        passwordHash,
      });

      this.audit.log({
        eventType: 'USER_CREATED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: userId,
        targetType: 'user',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { email: dto.email, roles: dto.roles, status: dto.status ?? 'pending', tenantId: ctx.tenantId },
        success: true,
      });

      this.metrics.incrementCounter('user_management_success', { operation: 'create' });
      this.metrics.recordLatency('user_management_request', Date.now() - startTime, { operation: 'create', success: 'true' });
      return { success: true, data: user };
    } catch (error) {
      console.error('[UserManagement] Create user error:', error);
      this.metrics.incrementCounter('user_management_error', { operation: 'create' });
      return { success: false, error: 'Failed to create user', errorCode: 'INTERNAL_ERROR' };
    }
  }

  private logAccessDenied(ctx: UserManagementContext, operation: string, reason: string): void {
    this.audit.log({
      eventType: 'USER_ACCESS_DENIED',
      actorId: ctx.actorId,
      actorType: ctx.actorType,
      channel: ctx.channel,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: { operation: `user_management_${operation}`, tenantId: ctx.tenantId, reason, actorRoles: ctx.actorRoles },
      success: false,
      errorMessage: reason,
    });
  }
}
