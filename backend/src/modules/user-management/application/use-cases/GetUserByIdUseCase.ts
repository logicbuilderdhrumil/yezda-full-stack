/**
 * Get User By ID Use Case
 */
import type {
  IUserManagementRepository,
  IAuditService,
  IMetricsService,
  ManagedUser,
  UserManagementResult,
  UserManagementContext,
} from '../../domain/index.js';
import { canManageUsers } from '../../domain/index.js';

export class GetUserByIdUseCase {
  constructor(
    private readonly repo: IUserManagementRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(ctx: UserManagementContext, userId: string): Promise<UserManagementResult<ManagedUser>> {
    const startTime = Date.now();

    if (!canManageUsers(ctx.actorRoles)) {
      this.audit.log({
        eventType: 'USER_ACCESS_DENIED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { operation: 'user_view', tenantId: ctx.tenantId, reason: 'Insufficient permissions', actorRoles: ctx.actorRoles },
        success: false,
        errorMessage: 'Insufficient permissions',
      });
      return { success: false, error: 'Insufficient permissions to view user details', errorCode: 'FORBIDDEN' };
    }

    try {
      const user = await this.repo.findById(userId, ctx.tenantId);

      if (!user) {
        this.metrics.recordLatency('user_management_request', Date.now() - startTime, { operation: 'view', success: 'false' });
        return { success: false, error: 'User not found', errorCode: 'NOT_FOUND' };
      }

      this.audit.log({
        eventType: 'USER_DETAILS_ACCESSED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: userId,
        targetType: 'user',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { operation: 'user_view', tenantId: ctx.tenantId },
        success: true,
      });

      this.metrics.recordLatency('user_management_request', Date.now() - startTime, { operation: 'view', success: 'true' });
      return { success: true, data: user };
    } catch (error) {
      console.error('[UserManagement] Get user error:', error);
      return { success: false, error: 'Failed to get user details', errorCode: 'INTERNAL_ERROR' };
    }
  }
}
