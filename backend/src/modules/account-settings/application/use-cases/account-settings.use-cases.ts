/**
 * Account Settings use cases.
 */
import type { IAccountSettingsRepository, UserProfile, Integration, IntegrationProvider, ProfileUpdateDto } from '../../domain/index.js';

export class GetProfile {
  constructor(private repo: IAccountSettingsRepository) {}
  async execute(tenantId: string, userId: string): Promise<UserProfile | null> {
    return this.repo.getProfile(tenantId, userId);
  }
}

export class UpdateProfile {
  constructor(private repo: IAccountSettingsRepository) {}
  async execute(tenantId: string, userId: string, data: ProfileUpdateDto): Promise<UserProfile | null> {
    return this.repo.updateProfile(tenantId, userId, data);
  }
}

export class GetIntegrations {
  constructor(private repo: IAccountSettingsRepository) {}
  async execute(tenantId: string, userId: string): Promise<Integration[]> {
    return this.repo.getIntegrations(tenantId, userId);
  }
}

export class GetIntegration {
  constructor(private repo: IAccountSettingsRepository) {}
  async execute(tenantId: string, userId: string, provider: IntegrationProvider): Promise<Integration | null> {
    return this.repo.getIntegration(tenantId, userId, provider);
  }
}

export class VerifyIntegration {
  constructor(private repo: IAccountSettingsRepository) {}
  async execute(tenantId: string, userId: string, provider: IntegrationProvider, data: Record<string, unknown>): Promise<Integration | null> {
    return this.repo.verifyIntegration(tenantId, userId, provider, data);
  }
}

export class DisconnectIntegration {
  constructor(private repo: IAccountSettingsRepository) {}
  async execute(tenantId: string, userId: string, provider: IntegrationProvider): Promise<boolean> {
    return this.repo.disconnectIntegration(tenantId, userId, provider);
  }
}

export class GetHealthSummary {
  constructor(private repo: IAccountSettingsRepository) {}
  async execute(): Promise<{ status: string }> {
    return this.repo.getHealth();
  }
}
