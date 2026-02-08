/**
 * App Application Intake Use Cases
 */

import type { IAppApplicationIntakeRepository } from '../domain/ports/IAppApplicationIntakeRepository.js';
import type { ApplicationResponse, Channel } from '../domain/entities/app-application-intake.entity.js';

export class AppApplicationIntakeUseCases {
  constructor(private readonly repo: IAppApplicationIntakeRepository) {}

  async listAssigned(candidateId: string, tenantId: string, channel: Channel, ipAddress?: string) {
    return this.repo.listAssignedApplications(candidateId, tenantId, channel, ipAddress);
  }

  async loadForm(applicationId: string, candidateId: string, channel: Channel, ipAddress?: string) {
    return this.repo.loadApplicationForm(applicationId, candidateId, channel, ipAddress);
  }

  async saveDraft(applicationId: string, candidateId: string, responses: ApplicationResponse[], channel: Channel, ipAddress?: string) {
    return this.repo.saveDraft(applicationId, candidateId, responses, channel, ipAddress);
  }

  async submit(applicationId: string, candidateId: string, responses: ApplicationResponse[], channel: Channel, ipAddress?: string, userAgent?: string) {
    return this.repo.submitApplication(applicationId, candidateId, responses, channel, ipAddress, userAgent);
  }
}
