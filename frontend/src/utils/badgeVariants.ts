/**
 * Shared badge variant helpers for consistent status/role → Badge variant mapping.
 *
 * Extracted from list and detail views to avoid duplication.
 */
import type { OrganizationStatus } from '@/@types/organization';
import type { UserStatus, UserRole } from '@/@types/user';
import type { CandidateStatus } from '@/@types/candidate';

/** Badge variant for organization status. */
export function getOrganizationStatusVariant(
  status: OrganizationStatus,
): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'suspended':
      return 'destructive';
    default:
      return 'secondary';
  }
}

/** Badge variant for user status. */
export function getUserStatusVariant(
  status: UserStatus,
): 'default' | 'secondary' | 'destructive' {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'inactive':
      return 'destructive';
    default:
      return 'secondary';
  }
}

/** Badge variant for user role. */
export function getUserRoleVariant(
  role: UserRole,
): 'default' | 'secondary' | 'outline' {
  switch (role) {
    case 'admin':
      return 'default';
    case 'manager':
      return 'secondary';
    default:
      return 'outline';
  }
}

/** Badge variant for candidate status. */
export function getCandidateStatusVariant(
  status: CandidateStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'active':
      return 'default';
    case 'pending':
      return 'secondary';
    case 'certified':
      return 'default';
    case 'archived':
      return 'destructive';
    default:
      return 'outline';
  }
}
