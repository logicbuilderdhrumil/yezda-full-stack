import type { OrgRole, ThemeMode } from '../entities/custom-components.entity.js';

export interface OrgMembership {
  orgId: string;
  orgName: string;
  logoUrl?: string;
  role: OrgRole;
}

export interface ICustomComponentsRepository {
  getOrgMemberships(userId: string): OrgMembership[];
  getActiveOrganizationId(userId: string): string | null;
  setActiveOrganizationId(userId: string, orgId: string): void;
  getThemePreference(userId: string): { mode: ThemeMode; updatedAt: Date } | undefined;
  setThemePreference(userId: string, mode: ThemeMode): Date;
}
