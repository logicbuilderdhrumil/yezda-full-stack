/**
 * User Management Lookup port
 * External dependency for resolving tenantId from managed_users table.
 * Injected to avoid coupling the auth module to the user-management module.
 */

export interface IUserManagementLookup {
  findByIdWithoutTenantScope(id: string): Promise<{ tenantId?: string } | undefined>;
}
