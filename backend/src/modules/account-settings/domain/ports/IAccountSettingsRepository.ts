/**
 * Account Settings repository port.
 */
import type { UserProfile, ProfileUpdateDto, Integration, IntegrationProvider } from '../entities/account-settings.entity.js';

export interface IAccountSettingsRepository {
  getProfile(tenantId: string, userId: string): Promise<UserProfile | null>;
  updateProfile(tenantId: string, userId: string, data: ProfileUpdateDto): Promise<UserProfile | null>;
  getIntegrations(tenantId: string, userId: string): Promise<Integration[]>;
  getIntegration(tenantId: string, userId: string, provider: IntegrationProvider): Promise<Integration | null>;
  verifyIntegration(tenantId: string, userId: string, provider: IntegrationProvider, data: Record<string, unknown>): Promise<Integration | null>;
  disconnectIntegration(tenantId: string, userId: string, provider: IntegrationProvider): Promise<boolean>;
  getHealth(): Promise<{ status: string }>;
}
