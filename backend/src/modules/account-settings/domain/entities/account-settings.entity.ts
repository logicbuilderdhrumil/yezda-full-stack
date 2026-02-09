/**
 * Account Settings domain entity.
 */
export interface UserProfile {
  id: string;
  tenantId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  phone: string | null;
  timezone: string;
  locale: string;
  bio: string | null;
  notificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type IntegrationProvider = 'google' | 'microsoft' | 'slack' | 'github';

export interface Integration {
  provider: IntegrationProvider;
  connected: boolean;
  providerAccountId?: string;
  providerEmail?: string;
  scopes?: string[];
  connectedAt?: Date;
}

export interface ProfileUpdateDto {
  displayName?: string;
  avatarUrl?: string | null;
  phone?: string | null;
  timezone?: string;
  locale?: string;
  bio?: string | null;
  notificationsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
}
