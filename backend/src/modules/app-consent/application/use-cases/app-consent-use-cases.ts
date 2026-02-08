/**
 * App Consent Use Cases
 */

import type { IAppConsentRepository } from '../../domain/ports/IAppConsentRepository.js';

export class AppConsentUseCases {
  constructor(private readonly repo: IAppConsentRepository) {}

  async captureConsent(tenantId: string, candidateId: string, body: unknown, actorId: string, actorType: string, channel: string, ipAddress?: string, userAgent?: string) {
    return this.repo.captureConsent(tenantId, candidateId, body, actorId, actorType, channel, ipAddress, userAgent);
  }

  async getConsentStatus(tenantId: string, candidateId: string, actorId: string, actorType: string, channel: string, ipAddress?: string) {
    return this.repo.getConsentStatus(tenantId, candidateId, actorId, actorType, channel, ipAddress);
  }

  async withdrawConsent(tenantId: string, candidateId: string, reason: string | undefined, actorId: string, actorType: string, channel: string, ipAddress?: string, userAgent?: string) {
    return this.repo.withdrawConsent(tenantId, candidateId, reason, actorId, actorType, channel, ipAddress, userAgent);
  }

  async checkDataReuse(tenantId: string, body: unknown, actorId: string, actorType: string, channel: string, ipAddress?: string) {
    return this.repo.checkDataReuse(tenantId, body, actorId, actorType, channel, ipAddress);
  }
}
