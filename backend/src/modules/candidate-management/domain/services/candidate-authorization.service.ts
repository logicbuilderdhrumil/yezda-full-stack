/**
 * Candidate Authorization Service
 * Centralized authorization helpers for candidate management operations.
 */

import type { UserRole } from '../entities/candidate.entity.js';

/**
 * Check if the actor has permission to manage candidates (CRUD operations).
 */
export function canManageCandidates(roles: UserRole[]): boolean {
  return roles.includes('admin') || roles.includes('manager') || roles.includes('agent');
}

/**
 * Check if the actor has permission to certify candidates.
 */
export function canCertifyCandidates(roles: UserRole[]): boolean {
  return roles.includes('admin') || roles.includes('manager');
}

/**
 * Check if the actor has permission to archive candidates.
 */
export function canArchiveCandidates(roles: UserRole[]): boolean {
  return roles.includes('admin') || roles.includes('manager');
}
