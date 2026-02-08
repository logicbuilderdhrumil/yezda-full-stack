/**
 * User Management Repository Port
 */
import type {
  ManagedUser,
  CreateUserDto,
  UpdateUserDto,
  UserSearchParams,
  UserListResult,
  UserStatus,
  UserRole,
} from '../entities/user-management.entity.js';

export interface IUserManagementRepository {
  search(params: UserSearchParams & { tenantId: string }): Promise<UserListResult>;
  findById(id: string, tenantId: string): Promise<ManagedUser | undefined>;
  findByEmail(email: string, tenantId: string): Promise<ManagedUser | undefined>;
  emailExists(email: string, tenantId: string): Promise<boolean>;
  create(input: CreateUserDto & { id: string; tenantId: string; createdBy?: string; passwordHash?: string }): Promise<ManagedUser>;
  update(id: string, tenantId: string, input: UpdateUserDto & { updatedBy?: string }): Promise<ManagedUser | undefined>;
  updateStatus(id: string, tenantId: string, status: UserStatus, updatedBy?: string): Promise<ManagedUser | undefined>;
  updateRoles(id: string, tenantId: string, roles: UserRole[], updatedBy?: string): Promise<ManagedUser | undefined>;
  softDelete(id: string, tenantId: string, deletedBy?: string): Promise<boolean>;
}
