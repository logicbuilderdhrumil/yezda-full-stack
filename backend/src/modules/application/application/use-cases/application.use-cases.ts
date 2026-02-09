import type { IApplicationRepository, Application } from '../../domain/index.js';

export class ListApplications {
  constructor(private repo: IApplicationRepository) {}
  async execute(tenantId: string, userId: string): Promise<Application[]> { return this.repo.findAll(tenantId, userId); }
}

export class GetApplication {
  constructor(private repo: IApplicationRepository) {}
  async execute(tenantId: string, applicationId: string): Promise<Application | null> { return this.repo.findById(tenantId, applicationId); }
}

export class GetApplicationDraft {
  constructor(private repo: IApplicationRepository) {}
  async execute(tenantId: string, applicationId: string): Promise<Record<string, unknown> | null> { return this.repo.getDraft(tenantId, applicationId); }
}

export class SaveApplicationDraft {
  constructor(private repo: IApplicationRepository) {}
  async execute(tenantId: string, applicationId: string, data: Record<string, unknown>): Promise<Application | null> {
    return this.repo.saveDraft(tenantId, applicationId, data);
  }
}

export class SubmitApplication {
  constructor(private repo: IApplicationRepository) {}
  async execute(tenantId: string, applicationId: string): Promise<Application | null> { return this.repo.submit(tenantId, applicationId); }
}
