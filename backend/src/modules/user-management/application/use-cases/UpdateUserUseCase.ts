/**
 * Update User Use Case
 */
import type {
  IUserManagementRepository,
  IAuditService,
  IMetricsService,
  ManagedUser,
  UserManagementResult,
  UserManagementContext,
  UpdateUserDto,
} from '../../domain/index.js';
import { canManageUsers, canAssignRole } from '../../domain/index.js';

export class UpdateUserUseCase {
  constructor(
    private readonly repo: IUserManagementRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(ctx: UserManagementContext, userId: string, dto: UpdateUserDto): Promise<UserManagementResult<ManagedUser>> {
    const startTime = Date.now();

    if (!canManageUsers(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'update', 'Insufficient permissions');
      return { success: false, error: 'Insufficient permissions to update users', errorCode: 'FORBIDDEN' };
    }

    // If updating roles, check if actor can assign all requested roles
    if (dto.roles) {
      for (const role of dto.roles) {
        if (!canAssignRole(ctx.actorRoles, role)) {
          this.logAccessDenied(ctx, 'update', `Cannot assign role: ${role}`);
          return { success: false, error: `Insufficient permissions to assign role: ${role}`, errorCode: 'FORBIDDEN' };
        }
      }
    }

    try {
      const existingUser = await this.repo.findById(userId, ctx.tenantId);
      if (!existingUser) {
        this.metrics.recordLatency('user_management_request', Date.now() - startTime, { operation: 'update', success: 'false' });
        return { success: false, error: 'User not found', errorCode: 'NOT_FOUND' };
      }

      const updatedUser = await this.repo.update(userId, ctx.tenantId, {
        ...dto,
        updatedBy: ctx.actorId,
      });

      if (!updatedUser) {
        this.metrics.recordLatency('user_management_request', Date.now() - startTime, { operation: 'update', success: 'false' });
        return { success: false, error: 'Failed to update user', errorCode: 'INTERNAL_ERROR' };
      }

      // Build changes metadata
      const changes: Record<string, unknown> = {};
      if (dto.status && dto.status !== existingUser.status) {
        changes.status = { from: existingUser.status, to: dto.status };
      }
      if (dto.roles && JSON.stringify(dto.roles) !== JSON.stringify(existingUser.roles)) {
        changes.roles = { from: existingUser.roles, to: dto.roles };
      }
      if (dto.displayName !== undefined && dto.displayName !== existingUser.displayName) {
        changes.displayName = { from: existingUser.displayName, to: dto.displayName };
      }

      this.audit.log({
        eventType: 'USER_UPDATED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: userId,
        targetType: 'user',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { operation: 'user_update', tenantId: ctx.tenantId, changes },
        success: true,
      });

      this.metrics.incrementCounter('user_management_success', { operation: 'update' });
      this.metrics.recordLatency('user_management_request', Date.now() - startTime, { operation: 'update', success: 'true' });
      return { success: true, data: updatedUser };
    } catch (error) {
      console.error('[UserManagement] Update user error:', error);
      this.metrics.incrementCounter('user_management_error', { operation: 'update' });
      return { success: false, error: 'Failed to update user', errorCode: 'INTERNAL_ERROR' };
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
