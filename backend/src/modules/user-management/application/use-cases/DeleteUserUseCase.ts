/**
 * Delete User Use Case
 */
import type {
  IUserManagementRepository,
  IAuditService,
  IMetricsService,
  UserManagementResult,
  UserManagementContext,
} from '../../domain/index.js';

export class DeleteUserUseCase {
  constructor(
    private readonly repo: IUserManagementRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(ctx: UserManagementContext, userId: string): Promise<UserManagementResult<void>> {
    const startTime = Date.now();

    // Only admins can delete users
    if (!ctx.actorRoles.includes('admin')) {
      this.audit.log({
        eventType: 'USER_ACCESS_DENIED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { operation: 'user_management_delete', tenantId: ctx.tenantId, reason: 'Only admins can delete users', actorRoles: ctx.actorRoles },
        success: false,
        errorMessage: 'Only admins can delete users',
      });
      return { success: false, error: 'Only admins can delete users', errorCode: 'FORBIDDEN' };
    }

    // Prevent self-deletion
    if (userId === ctx.actorId) {
      return { success: false, error: 'Cannot delete your own account', errorCode: 'SELF_DELETE_FORBIDDEN' };
    }

    try {
      const existingUser = await this.repo.findById(userId, ctx.tenantId);
      if (!existingUser) {
        this.metrics.recordLatency('user_management_request', Date.now() - startTime, { operation: 'delete', success: 'false' });
        return { success: false, error: 'User not found', errorCode: 'NOT_FOUND' };
      }

      const deleted = await this.repo.softDelete(userId, ctx.tenantId, ctx.actorId);

      if (!deleted) {
        this.metrics.recordLatency('user_management_request', Date.now() - startTime, { operation: 'delete', success: 'false' });
        return { success: false, error: 'Failed to delete user', errorCode: 'INTERNAL_ERROR' };
      }

      this.audit.log({
        eventType: 'USER_DELETED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: userId,
        targetType: 'user',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { operation: 'user_delete', tenantId: ctx.tenantId, deletedUserEmail: existingUser.email },
        success: true,
      });

      this.metrics.incrementCounter('user_management_success', { operation: 'delete' });
      this.metrics.recordLatency('user_management_request', Date.now() - startTime, { operation: 'delete', success: 'true' });
      return { success: true };
    } catch (error) {
      console.error('[UserManagement] Delete user error:', error);
      this.metrics.incrementCounter('user_management_error', { operation: 'delete' });
      return { success: false, error: 'Failed to delete user', errorCode: 'INTERNAL_ERROR' };
    }
  }
}
