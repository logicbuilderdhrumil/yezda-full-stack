import type { IApplicationRepository } from '../../domain/ports/IApplicationRepository.js';
import type { Application } from '../../domain/entities/application.entity.js';

export class InMemoryApplicationRepository implements IApplicationRepository {
  private apps: Application[] = [];

  async findAll(tenantId: string, userId: string): Promise<Application[]> {
    return this.apps.filter((a) => a.tenantId === tenantId && a.userId === userId);
  }

  async findById(tenantId: string, applicationId: string): Promise<Application | null> {
    return this.apps.find((a) => a.id === applicationId && a.tenantId === tenantId) ?? null;
  }

  async getDraft(tenantId: string, applicationId: string): Promise<Record<string, unknown> | null> {
    const app = this.apps.find((a) => a.id === applicationId && a.tenantId === tenantId);
    return app?.draftData ?? null;
  }

  async saveDraft(tenantId: string, applicationId: string, data: Record<string, unknown>): Promise<Application | null> {
    const idx = this.apps.findIndex((a) => a.id === applicationId && a.tenantId === tenantId);
    if (idx === -1) return null;
    this.apps[idx] = { ...this.apps[idx], draftData: data, updatedAt: new Date() };
    return this.apps[idx];
  }

  async submit(tenantId: string, applicationId: string): Promise<Application | null> {
    const idx = this.apps.findIndex((a) => a.id === applicationId && a.tenantId === tenantId);
    if (idx === -1) return null;
    const now = new Date();
    this.apps[idx] = { ...this.apps[idx], status: 'submitted', submittedAt: now, updatedAt: now };
    return this.apps[idx];
  }
}
