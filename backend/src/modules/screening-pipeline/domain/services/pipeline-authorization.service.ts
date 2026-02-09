/**
 * Pipeline Authorization Service
 * Centralized authorization helpers for screening pipeline operations.
 */

/**
 * Check if actor has permission to manage pipelines (create, update, delete).
 */
export function canManagePipelines(roles: string[]): boolean {
  return roles.includes('admin') || roles.includes('manager');
}

/**
 * Check if actor has permission to view pipelines.
 */
export function canViewPipelines(roles: string[]): boolean {
  return roles.includes('admin') || roles.includes('manager') || roles.includes('agent');
}

/**
 * Check if actor has permission to assign pipelines.
 */
export function canAssignPipelines(roles: string[]): boolean {
  return roles.includes('admin') || roles.includes('manager') || roles.includes('agent');
}
