/**
 * User Management Service
 * Task 1.2, 1.3, 1.5, 1.6: Business logic for user management operations
 * Enforces RBAC and tenant isolation at the service layer.
 */

import { v4 as uuidv4 } from 'uuid';
import { userManagementRepository } from '../repositories/user-management.repository.js';
import { auditService } from './audit.service.js';
import { metricsService } from './metrics.service.js';
import { passwordService } from './password.service.js';
import type {
  ManagedUser,
  CreateUserInput,
  UpdateUserInput,
  UserSearchParams,
  UserListResult,
  UserManagementResult,
  UserStatus,
} from '../models/user-management.model.js';
import type { UserRole } from '../middleware/route-guards.middleware.js';

export interface UserManagementContext {
  actorId: string;
  actorType: 'user' | 'candidate';
  actorRoles: UserRole[];
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  channel: 'web' | 'mobile' | 'api';
}

/**
 * Check if actor has admin or manager role
 */
function canManageUsers(roles: UserRole[]): boolean {
  return roles.includes('admin') || roles.includes('manager');
}

/**
 * Check if actor can assign a specific role
 * Admins can assign any role, managers can only assign agent/viewer
 */
function canAssignRole(actorRoles: UserRole[], targetRole: UserRole): boolean {
  if (actorRoles.includes('admin')) return true;
  if (actorRoles.includes('manager')) {
    return targetRole === 'agent' || targetRole === 'viewer';
  }
  return false;
}

export class UserManagementService {
  /**
   * List users with search, filter, and pagination
   */
  async listUsers(
    params: Omit<UserSearchParams, 'tenantId'>,
    ctx: UserManagementContext
  ): Promise<UserManagementResult<UserListResult>> {
    const startTime = Date.now();

    // Check permissions
    if (!canManageUsers(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'list', 'Insufficient permissions');
      metricsService.incrementCounter('user_management_access_denied', { operation: 'list' });
      return {
        success: false,
        error: 'Insufficient permissions to list users',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      const result = await userManagementRepository.search({
        ...params,
        tenantId: ctx.tenantId,
      });

      // Audit log access
      auditService.log({
        eventType: 'GUARD_ACCESS_GRANTED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'user_list',
          tenantId: ctx.tenantId,
          resultCount: result.users.length,
          totalCount: result.total,
        },
        success: true,
      });

      metricsService.recordLatency('user_management_request_latency', Date.now() - startTime, {
        operation: 'list',
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('[UserManagement] List users error:', error);
      metricsService.incrementCounter('user_management_error', { operation: 'list' });
      return {
        success: false,
        error: 'Failed to list users',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Get user details by ID
   */
  async getUserById(
    userId: string,
    ctx: UserManagementContext
  ): Promise<UserManagementResult<ManagedUser>> {
    const startTime = Date.now();

    // Check permissions
    if (!canManageUsers(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'view', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to view user details',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      const user = await userManagementRepository.findById(userId, ctx.tenantId);

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          errorCode: 'NOT_FOUND',
        };
      }

      // Audit log access
      auditService.log({
        eventType: 'GUARD_ACCESS_GRANTED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: userId,
        targetType: 'user',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'user_view',
          tenantId: ctx.tenantId,
        },
        success: true,
      });

      metricsService.recordLatency('user_management_request_latency', Date.now() - startTime, {
        operation: 'view',
      });

      return { success: true, data: user };
    } catch (error) {
      console.error('[UserManagement] Get user error:', error);
      return {
        success: false,
        error: 'Failed to get user details',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Create a new user
   */
  async createUser(
    input: Omit<CreateUserInput, 'tenantId'>,
    ctx: UserManagementContext
  ): Promise<UserManagementResult<ManagedUser>> {
    const startTime = Date.now();

    // Check permissions
    if (!canManageUsers(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'create', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to create users',
        errorCode: 'FORBIDDEN',
      };
    }

    // Check if actor can assign requested roles
    for (const role of input.roles) {
      if (!canAssignRole(ctx.actorRoles, role)) {
        this.logAccessDenied(ctx, 'create', `Cannot assign role: ${role}`);
        return {
          success: false,
          error: `Insufficient permissions to assign role: ${role}`,
          errorCode: 'FORBIDDEN',
        };
      }
    }

    try {
      // Check if email already exists in this tenant
      const emailExists = await userManagementRepository.emailExists(
        input.email,
        ctx.tenantId
      );
      if (emailExists) {
        return {
          success: false,
          error: 'Email already exists in this organization',
          errorCode: 'EMAIL_EXISTS',
        };
      }

      // Hash password if provided
      let passwordHash: string | undefined;
      if (input.password) {
        passwordHash = await passwordService.hash(input.password);
      }

      const userId = uuidv4();
      const user = await userManagementRepository.create({
        ...input,
        id: userId,
        tenantId: ctx.tenantId,
        createdBy: ctx.actorId,
        passwordHash,
      });

      // Audit log creation
      auditService.log({
        eventType: 'AUTH_SIGN_UP',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: userId,
        targetType: 'user',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'user_create',
          tenantId: ctx.tenantId,
          email: input.email,
          roles: input.roles,
          status: input.status ?? 'pending',
        },
        success: true,
      });

      metricsService.incrementCounter('user_management_success', { operation: 'create' });
      metricsService.recordLatency('user_management_request_latency', Date.now() - startTime, {
        operation: 'create',
      });

      return { success: true, data: user };
    } catch (error) {
      console.error('[UserManagement] Create user error:', error);
      metricsService.incrementCounter('user_management_error', { operation: 'create' });
      return {
        success: false,
        error: 'Failed to create user',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Update user details
   */
  async updateUser(
    userId: string,
    input: UpdateUserInput,
    ctx: UserManagementContext
  ): Promise<UserManagementResult<ManagedUser>> {
    const startTime = Date.now();

    // Check permissions
    if (!canManageUsers(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'update', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to update users',
        errorCode: 'FORBIDDEN',
      };
    }

    // If updating roles, check if actor can assign all requested roles
    if (input.roles) {
      for (const role of input.roles) {
        if (!canAssignRole(ctx.actorRoles, role)) {
          this.logAccessDenied(ctx, 'update', `Cannot assign role: ${role}`);
          return {
            success: false,
            error: `Insufficient permissions to assign role: ${role}`,
            errorCode: 'FORBIDDEN',
          };
        }
      }
    }

    try {
      // Get existing user first
      const existingUser = await userManagementRepository.findById(userId, ctx.tenantId);
      if (!existingUser) {
        return {
          success: false,
          error: 'User not found',
          errorCode: 'NOT_FOUND',
        };
      }

      const updatedUser = await userManagementRepository.update(userId, ctx.tenantId, {
        ...input,
        updatedBy: ctx.actorId,
      });

      if (!updatedUser) {
        return {
          success: false,
          error: 'Failed to update user',
          errorCode: 'INTERNAL_ERROR',
        };
      }

      // Audit log changes
      const changes: Record<string, unknown> = {};
      if (input.status && input.status !== existingUser.status) {
        changes.status = { from: existingUser.status, to: input.status };
      }
      if (input.roles && JSON.stringify(input.roles) !== JSON.stringify(existingUser.roles)) {
        changes.roles = { from: existingUser.roles, to: input.roles };
      }
      if (input.displayName !== undefined && input.displayName !== existingUser.displayName) {
        changes.displayName = { from: existingUser.displayName, to: input.displayName };
      }

      auditService.log({
        eventType: 'SHELL_PREFERENCE_UPDATED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: userId,
        targetType: 'user',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'user_update',
          tenantId: ctx.tenantId,
          changes,
        },
        success: true,
      });

      metricsService.incrementCounter('user_management_success', { operation: 'update' });
      metricsService.recordLatency('user_management_request_latency', Date.now() - startTime, {
        operation: 'update',
      });

      return { success: true, data: updatedUser };
    } catch (error) {
      console.error('[UserManagement] Update user error:', error);
      metricsService.incrementCounter('user_management_error', { operation: 'update' });
      return {
        success: false,
        error: 'Failed to update user',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(
    userId: string,
    status: UserStatus,
    ctx: UserManagementContext
  ): Promise<UserManagementResult<ManagedUser>> {
    const startTime = Date.now();

    // Check permissions
    if (!canManageUsers(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'status_update', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to update user status',
        errorCode: 'FORBIDDEN',
      };
    }

    try {
      const existingUser = await userManagementRepository.findById(userId, ctx.tenantId);
      if (!existingUser) {
        return {
          success: false,
          error: 'User not found',
          errorCode: 'NOT_FOUND',
        };
      }

      const updatedUser = await userManagementRepository.updateStatus(
        userId,
        ctx.tenantId,
        status,
        ctx.actorId
      );

      if (!updatedUser) {
        return {
          success: false,
          error: 'Failed to update user status',
          errorCode: 'INTERNAL_ERROR',
        };
      }

      // Audit log status change
      auditService.log({
        eventType: 'SHELL_PREFERENCE_UPDATED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: userId,
        targetType: 'user',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'user_status_change',
          tenantId: ctx.tenantId,
          previousStatus: existingUser.status,
          newStatus: status,
        },
        success: true,
      });

      metricsService.incrementCounter('user_management_success', { operation: 'status_update' });
      metricsService.recordLatency('user_management_request_latency', Date.now() - startTime, {
        operation: 'status_update',
      });

      return { success: true, data: updatedUser };
    } catch (error) {
      console.error('[UserManagement] Update status error:', error);
      metricsService.incrementCounter('user_management_error', { operation: 'status_update' });
      return {
        success: false,
        error: 'Failed to update user status',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Update user roles
   */
  async updateUserRoles(
    userId: string,
    roles: UserRole[],
    ctx: UserManagementContext
  ): Promise<UserManagementResult<ManagedUser>> {
    const startTime = Date.now();

    // Check permissions
    if (!canManageUsers(ctx.actorRoles)) {
      this.logAccessDenied(ctx, 'role_update', 'Insufficient permissions');
      return {
        success: false,
        error: 'Insufficient permissions to update user roles',
        errorCode: 'FORBIDDEN',
      };
    }

    // Check if actor can assign all requested roles
    for (const role of roles) {
      if (!canAssignRole(ctx.actorRoles, role)) {
        this.logAccessDenied(ctx, 'role_update', `Cannot assign role: ${role}`);
        return {
          success: false,
          error: `Insufficient permissions to assign role: ${role}`,
          errorCode: 'FORBIDDEN',
        };
      }
    }

    try {
      const existingUser = await userManagementRepository.findById(userId, ctx.tenantId);
      if (!existingUser) {
        return {
          success: false,
          error: 'User not found',
          errorCode: 'NOT_FOUND',
        };
      }

      const updatedUser = await userManagementRepository.updateRoles(
        userId,
        ctx.tenantId,
        roles,
        ctx.actorId
      );

      if (!updatedUser) {
        return {
          success: false,
          error: 'Failed to update user roles',
          errorCode: 'INTERNAL_ERROR',
        };
      }

      // Audit log role change
      auditService.log({
        eventType: 'SHELL_PREFERENCE_UPDATED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: userId,
        targetType: 'user',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'user_role_change',
          tenantId: ctx.tenantId,
          previousRoles: existingUser.roles,
          newRoles: roles,
        },
        success: true,
      });

      metricsService.incrementCounter('user_management_success', { operation: 'role_update' });
      metricsService.recordLatency('user_management_request_latency', Date.now() - startTime, {
        operation: 'role_update',
      });

      return { success: true, data: updatedUser };
    } catch (error) {
      console.error('[UserManagement] Update roles error:', error);
      metricsService.incrementCounter('user_management_error', { operation: 'role_update' });
      return {
        success: false,
        error: 'Failed to update user roles',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Delete (deactivate) a user
   */
  async deleteUser(
    userId: string,
    ctx: UserManagementContext
  ): Promise<UserManagementResult<void>> {
    const startTime = Date.now();

    // Only admins can delete users
    if (!ctx.actorRoles.includes('admin')) {
      this.logAccessDenied(ctx, 'delete', 'Only admins can delete users');
      return {
        success: false,
        error: 'Only admins can delete users',
        errorCode: 'FORBIDDEN',
      };
    }

    // Prevent self-deletion
    if (userId === ctx.actorId) {
      return {
        success: false,
        error: 'Cannot delete your own account',
        errorCode: 'SELF_DELETE_FORBIDDEN',
      };
    }

    try {
      const existingUser = await userManagementRepository.findById(userId, ctx.tenantId);
      if (!existingUser) {
        return {
          success: false,
          error: 'User not found',
          errorCode: 'NOT_FOUND',
        };
      }

      const deleted = await userManagementRepository.softDelete(userId, ctx.tenantId, ctx.actorId);

      if (!deleted) {
        return {
          success: false,
          error: 'Failed to delete user',
          errorCode: 'INTERNAL_ERROR',
        };
      }

      // Audit log deletion
      auditService.log({
        eventType: 'SHELL_PREFERENCE_UPDATED',
        actorId: ctx.actorId,
        actorType: ctx.actorType,
        targetId: userId,
        targetType: 'user',
        channel: ctx.channel,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        metadata: {
          operation: 'user_delete',
          tenantId: ctx.tenantId,
          deletedUserEmail: existingUser.email,
        },
        success: true,
      });

      metricsService.incrementCounter('user_management_success', { operation: 'delete' });
      metricsService.recordLatency('user_management_request_latency', Date.now() - startTime, {
        operation: 'delete',
      });

      return { success: true };
    } catch (error) {
      console.error('[UserManagement] Delete user error:', error);
      metricsService.incrementCounter('user_management_error', { operation: 'delete' });
      return {
        success: false,
        error: 'Failed to delete user',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  /**
   * Helper to log access denied events
   */
  private logAccessDenied(
    ctx: UserManagementContext,
    operation: string,
    reason: string
  ): void {
    auditService.log({
      eventType: 'GUARD_ROLE_DENIED',
      actorId: ctx.actorId,
      actorType: ctx.actorType,
      channel: ctx.channel,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      metadata: {
        operation: `user_management_${operation}`,
        tenantId: ctx.tenantId,
        reason,
        actorRoles: ctx.actorRoles,
      },
      success: false,
      errorMessage: reason,
    });
  }
}

export const userManagementService = new UserManagementService();
