/**
 * Update User Roles Use Case
 */
import type {
  IUserManagementRepository,
  IAuditService,
  IMetricsService,
  ManagedUser,
  UserManagementResult,
  UserManagementContext,
  UserRole,
} from '../../domain/index.js';
import { canManageUsers, canAssignRole } from '../../domain/index.js';

export class UpdateUserRolesUseCase {
  constructor(
    private readonly repo: IUserManagementRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(ctx: UserManagementContext, userId: string, roles: UserRole[]): Promise<UserManagementResult<ManagedUser>> {
    const startTime = Date.now();

    if (!canManageUsers(ctx.actorRoles)) {
      this.audit.log({
        eventType: 'USER_ACCESS_DENIED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { operation: 'user_management_role_update', tenantId: ctx.tenantId, reason: 'Insufficient permissions', actorRoles: ctx.actorRoles },
        success: false,
        errorMessage: 'Insufficient permissions',
      });
      return { success: false, error: 'Insufficient permissions to update user roles', errorCode: 'FORBIDDEN' };
    }

    // Check if actor can assign all requested roles
    for (const role of roles) {
      if (!canAssignRole(ctx.actorRoles, role)) {
        this.audit.log({
          eventType: 'USER_ACCESS_DENIED',
          actorId: ctx.actorId,
          actorType: ctx.actorType,
          channel: ctx.channel,
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
          metadata: { operation: 'user_management_role_update', tenantId: ctx.tenantId, reason: `Cannot assign role: ${role}`, actorRoles: ctx.actorRoles },
          success: false,
          errorMessage: `Cannot assign role: ${role}`,
        });
        return { success: false, error: `Insufficient permissions to assign role: ${role}`, errorCode: 'FORBIDDEN' };
      }
    }

    try {
      const existingUser = await this.repo.findById(userId, ctx.tenantId);
      if (!existingUser) {
        this.metrics.recordLatency('user_management_request', Date.now() - startTime, { operation: 'role_update', success: 'false' });
        return { success: false, error: 'User not found', errorCode: 'NOT_FOUND' };
      }

      const updatedUser = await this.repo.updateRoles(userId, ctx.tenantId, roles, ctx.actorId);

      if (!updatedUser) {
        this.metrics.recordLatency('user_management_request', Date.now() - startTime, { operation: 'role_update', success: 'false' });
        return { success: false, error: 'Failed to update user roles', errorCode: 'INTERNAL_ERROR' };
      }

      this.audit.log({
        eventType: 'USER_ROLE_CHANGED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: userId,
        targetType: 'user',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { operation: 'user_role_change', tenantId: ctx.tenantId, previousRoles: existingUser.roles, newRoles: roles },
        success: true,
      });

      this.metrics.incrementCounter('user_management_success', { operation: 'role_update' });
      this.metrics.recordLatency('user_management_request', Date.now() - startTime, { operation: 'role_update', success: 'true' });
      return { success: true, data: updatedUser };
    } catch (error) {
      console.error('[UserManagement] Update roles error:', error);
      this.metrics.incrementCounter('user_management_error', { operation: 'role_update' });
      return { success: false, error: 'Failed to update user roles', errorCode: 'INTERNAL_ERROR' };
    }
  }
}
