/**
 * In-memory account settings repository.
 */
import type { IAccountSettingsRepository } from '../../domain/ports/IAccountSettingsRepository.js';
import type { UserProfile, ProfileUpdateDto, Integration, IntegrationProvider } from '../../domain/entities/account-settings.entity.js';

export class InMemoryAccountSettingsRepository implements IAccountSettingsRepository {
  private profiles: Map<string, UserProfile> = new Map();
  private integrations: Map<string, Integration[]> = new Map();

  private key(tenantId: string, userId: string): string {
    return `${tenantId}:${userId}`;
  }

  async getProfile(tenantId: string, userId: string): Promise<UserProfile | null> {
    return this.profiles.get(this.key(tenantId, userId)) ?? null;
  }

  async updateProfile(tenantId: string, userId: string, data: ProfileUpdateDto): Promise<UserProfile | null> {
    const k = this.key(tenantId, userId);
    let profile = this.profiles.get(k);
    if (!profile) {
      profile = {
        id: userId,
        tenantId,
        email: '',
        displayName: data.displayName ?? '',
        avatarUrl: null,
        phone: null,
        timezone: 'UTC',
        locale: 'en',
        bio: null,
        notificationsEnabled: true,
        emailNotificationsEnabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    profile = { ...profile, ...data, updatedAt: new Date() };
    this.profiles.set(k, profile);
    return profile;
  }

  async getIntegrations(tenantId: string, userId: string): Promise<Integration[]> {
    return this.integrations.get(this.key(tenantId, userId)) ?? [];
  }

  async getIntegration(tenantId: string, userId: string, provider: IntegrationProvider): Promise<Integration | null> {
    const list = this.integrations.get(this.key(tenantId, userId)) ?? [];
    return list.find((i) => i.provider === provider) ?? null;
  }

  async verifyIntegration(tenantId: string, userId: string, provider: IntegrationProvider, data: Record<string, unknown>): Promise<Integration | null> {
    const k = this.key(tenantId, userId);
    const list = this.integrations.get(k) ?? [];
    const existing = list.find((i) => i.provider === provider);
    const integration: Integration = {
      provider,
      connected: true,
      providerAccountId: (data.providerAccountId as string) ?? existing?.providerAccountId,
      providerEmail: (data.providerEmail as string) ?? existing?.providerEmail,
      scopes: (data.scopes as string[]) ?? existing?.scopes,
      connectedAt: new Date(),
    };
    const idx = list.findIndex((i) => i.provider === provider);
    if (idx >= 0) list[idx] = integration;
    else list.push(integration);
    this.integrations.set(k, list);
    return integration;
  }

  async disconnectIntegration(tenantId: string, userId: string, provider: IntegrationProvider): Promise<boolean> {
    const k = this.key(tenantId, userId);
    const list = this.integrations.get(k) ?? [];
    const idx = list.findIndex((i) => i.provider === provider);
    if (idx === -1) return false;
    list.splice(idx, 1);
    this.integrations.set(k, list);
    return true;
  }

  async getHealth(): Promise<{ status: string }> {
    return { status: 'healthy' };
  }
}
