/**
 * App Application Intake Repository Port
 */

import type { ApplicationResponse, ApplicationResult, Channel } from '../entities/app-application-intake.entity.js';

export interface IAppApplicationIntakeRepository {
  listAssignedApplications(candidateId: string, tenantId: string, channel: Channel, ipAddress?: string): Promise<ApplicationResult>;
  loadApplicationForm(applicationId: string, candidateId: string, channel: Channel, ipAddress?: string): Promise<ApplicationResult>;
  saveDraft(applicationId: string, candidateId: string, responses: ApplicationResponse[], channel: Channel, ipAddress?: string): Promise<ApplicationResult>;
  submitApplication(applicationId: string, candidateId: string, responses: ApplicationResponse[], channel: Channel, ipAddress?: string, userAgent?: string): Promise<ApplicationResult>;
}
