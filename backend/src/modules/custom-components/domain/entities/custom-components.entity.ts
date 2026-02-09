export type OrgRole = 'owner' | 'admin' | 'manager' | 'agent' | 'viewer';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface OrganizationContextItem {
  id: string;
  name: string;
  logoUrl?: string;
  role: OrgRole;
  isActive: boolean;
}

export interface OrganizationContextResponse {
  organizations: OrganizationContextItem[];
  activeOrganizationId: string | null;
}

export interface ThemePreferenceResponse {
  mode: ThemeMode;
  updatedAt: string;
}

export interface CustomComponentsResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}
