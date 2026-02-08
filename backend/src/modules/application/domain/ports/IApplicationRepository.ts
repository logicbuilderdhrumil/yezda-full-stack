import type { Application } from '../entities/application.entity.js';

export interface IApplicationRepository {
  findAll(tenantId: string, userId: string): Promise<Application[]>;
  findById(tenantId: string, applicationId: string): Promise<Application | null>;
  getDraft(tenantId: string, applicationId: string): Promise<Record<string, unknown> | null>;
  saveDraft(tenantId: string, applicationId: string, data: Record<string, unknown>): Promise<Application | null>;
  submit(tenantId: string, applicationId: string): Promise<Application | null>;
}
