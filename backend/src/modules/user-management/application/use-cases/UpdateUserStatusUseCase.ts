/**
 * Update User Status Use Case
 */
import type {
  IUserManagementRepository,
  IAuditService,
  IMetricsService,
  ManagedUser,
  UserManagementResult,
  UserManagementContext,
  UserStatus,
} from '../../domain/index.js';
import { canManageUsers } from '../../domain/index.js';

export class UpdateUserStatusUseCase {
  constructor(
    private readonly repo: IUserManagementRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(ctx: UserManagementContext, userId: string, status: UserStatus): Promise<UserManagementResult<ManagedUser>> {
    const startTime = Date.now();

    if (!canManageUsers(ctx.actorRoles)) {
      this.audit.log({
        eventType: 'USER_ACCESS_DENIED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { operation: 'user_management_status_update', tenantId: ctx.tenantId, reason: 'Insufficient permissions', actorRoles: ctx.actorRoles },
        success: false,
        errorMessage: 'Insufficient permissions',
      });
      return { success: false, error: 'Insufficient permissions to update user status', errorCode: 'FORBIDDEN' };
    }

    try {
      const existingUser = await this.repo.findById(userId, ctx.tenantId);
      if (!existingUser) {
        this.metrics.recordLatency('user_management_request', Date.now() - startTime, { operation: 'status_update', success: 'false' });
        return { success: false, error: 'User not found', errorCode: 'NOT_FOUND' };
      }

      const updatedUser = await this.repo.updateStatus(userId, ctx.tenantId, status, ctx.actorId);

      if (!updatedUser) {
        this.metrics.recordLatency('user_management_request', Date.now() - startTime, { operation: 'status_update', success: 'false' });
        return { success: false, error: 'Failed to update user status', errorCode: 'INTERNAL_ERROR' };
      }

      this.audit.log({
        eventType: 'USER_STATUS_CHANGED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: userId,
        targetType: 'user',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { operation: 'user_status_change', tenantId: ctx.tenantId, previousStatus: existingUser.status, newStatus: status },
        success: true,
      });

      this.metrics.incrementCounter('user_management_success', { operation: 'status_update' });
      this.metrics.recordLatency('user_management_request', Date.now() - startTime, { operation: 'status_update', success: 'true' });
      return { success: true, data: updatedUser };
    } catch (error) {
      console.error('[UserManagement] Update status error:', error);
      this.metrics.incrementCounter('user_management_error', { operation: 'status_update' });
      return { success: false, error: 'Failed to update user status', errorCode: 'INTERNAL_ERROR' };
    }
  }
}
