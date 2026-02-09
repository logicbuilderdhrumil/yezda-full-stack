import type { OrgRole, ThemeMode } from '../../domain/entities/custom-components.entity.js';
import type { ICustomComponentsRepository, OrgMembership } from '../../domain/ports/ICustomComponentsRepository.js';

const userOrgMemberships = new Map<string, OrgMembership[]>();
const activeOrganizations = new Map<string, string>();
const themePreferences = new Map<string, { mode: ThemeMode; updatedAt: Date }>();

// Seed mock data
const defaultOrgs: OrgMembership[] = [
  { orgId: 'org-1', orgName: 'Acme Corporation', logoUrl: 'https://example.com/acme-logo.png', role: 'admin' as OrgRole },
  { orgId: 'org-2', orgName: 'Globex Industries', logoUrl: 'https://example.com/globex-logo.png', role: 'viewer' as OrgRole },
  { orgId: 'org-3', orgName: 'Initech', role: 'manager' as OrgRole },
];
userOrgMemberships.set('__default__', defaultOrgs);

export class InMemoryCustomComponentsRepository implements ICustomComponentsRepository {
  getOrgMemberships(userId: string): OrgMembership[] {
    return userOrgMemberships.get(userId) ?? userOrgMemberships.get('__default__') ?? [];
  }
  getActiveOrganizationId(userId: string): string | null {
    return activeOrganizations.get(userId) ?? null;
  }
  setActiveOrganizationId(userId: string, orgId: string): void {
    activeOrganizations.set(userId, orgId);
  }
  getThemePreference(userId: string): { mode: ThemeMode; updatedAt: Date } | undefined {
    return themePreferences.get(userId);
  }
  setThemePreference(userId: string, mode: ThemeMode): Date {
    const now = new Date();
    themePreferences.set(userId, { mode, updatedAt: now });
    return now;
  }
}
