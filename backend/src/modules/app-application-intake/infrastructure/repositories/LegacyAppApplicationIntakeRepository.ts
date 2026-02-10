/**
 * Legacy App Application Intake Repository Adapter
 */

import type { IAppApplicationIntakeRepository } from '../../domain/ports/IAppApplicationIntakeRepository.js';
import type { ApplicationResponse, ApplicationResult, Channel } from '../../domain/entities/app-application-intake.entity.js';
import { appApplicationIntakeService } from '../../../../services/app-application-intake.service.js';

export class LegacyAppApplicationIntakeRepository implements IAppApplicationIntakeRepository {
  async listAssignedApplications(candidateId: string, tenantId: string, channel: Channel, ipAddress?: string): Promise<ApplicationResult> {
    return appApplicationIntakeService.listAssignedApplications(candidateId, tenantId, channel, ipAddress) as Promise<ApplicationResult>;
  }

  async loadApplicationForm(applicationId: string, candidateId: string, channel: Channel, ipAddress?: string): Promise<ApplicationResult> {
    return appApplicationIntakeService.loadApplicationForm(applicationId, candidateId, channel, ipAddress) as Promise<ApplicationResult>;
  }

  async saveDraft(applicationId: string, candidateId: string, responses: ApplicationResponse[], channel: Channel, ipAddress?: string): Promise<ApplicationResult> {
    return appApplicationIntakeService.saveDraft(applicationId, candidateId, responses, channel, ipAddress) as Promise<ApplicationResult>;
  }

  async submitApplication(applicationId: string, candidateId: string, responses: ApplicationResponse[], channel: Channel, ipAddress?: string, userAgent?: string): Promise<ApplicationResult> {
    return appApplicationIntakeService.submitApplication(applicationId, candidateId, responses, channel, ipAddress, userAgent) as Promise<ApplicationResult>;
  }
}
