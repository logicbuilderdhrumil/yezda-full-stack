/**
 * List Users Use Case
 */
import type {
  IUserManagementRepository,
  IAuditService,
  IMetricsService,
  UserManagementResult,
  UserManagementContext,
  UserSearchParams,
  UserListResult,
} from '../../domain/index.js';
import { canManageUsers } from '../../domain/index.js';

export class ListUsersUseCase {
  constructor(
    private readonly repo: IUserManagementRepository,
    private readonly audit: IAuditService,
    private readonly metrics: IMetricsService,
  ) {}

  async execute(
    ctx: UserManagementContext,
    params: Omit<UserSearchParams, 'tenantId'>,
  ): Promise<UserManagementResult<UserListResult>> {
    const startTime = Date.now();

    if (!canManageUsers(ctx.actorRoles)) {
      this.audit.log({
        eventType: 'USER_ACCESS_DENIED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { operation: 'user_list', tenantId: ctx.tenantId, reason: 'Insufficient permissions', actorRoles: ctx.actorRoles },
        success: false,
        errorMessage: 'Insufficient permissions',
      });
      this.metrics.incrementCounter('user_management_access_denied', { operation: 'list' });
      return { success: false, error: 'Insufficient permissions to list users', errorCode: 'FORBIDDEN' };
    }

    try {
      const result = await this.repo.search({ ...params, tenantId: ctx.tenantId });

      this.audit.log({
        eventType: 'USER_LIST_ACCESSED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: { operation: 'user_list', tenantId: ctx.tenantId, resultCount: result.users.length, totalCount: result.total },
        success: true,
      });

      this.metrics.recordLatency('user_management_request', Date.now() - startTime, { operation: 'list', success: 'true' });
      return { success: true, data: result };
    } catch (error) {
      console.error('[UserManagement] List users error:', error);
      this.metrics.incrementCounter('user_management_error', { operation: 'list' });
      return { success: false, error: 'Failed to list users', errorCode: 'INTERNAL_ERROR' };
    }
  }
}
