/**
 * Legacy App Consent Repository Adapter
 */

import type { IAppConsentRepository } from '../../domain/ports/IAppConsentRepository.js';
import type { ConsentResult } from '../../domain/entities/app-consent.entity.js';
import { appConsentService } from '../../../../services/app-consent.service.js';

export class LegacyAppConsentRepository implements IAppConsentRepository {
  async captureConsent(tenantId: string, candidateId: string, body: unknown, actorId: string, actorType: string, channel: string, ipAddress?: string, userAgent?: string): Promise<ConsentResult> {
    return appConsentService.captureConsent(tenantId, candidateId, body, actorId, actorType, channel, ipAddress, userAgent) as Promise<ConsentResult>;
  }

  async getConsentStatus(tenantId: string, candidateId: string, actorId: string, actorType: string, channel: string, ipAddress?: string): Promise<ConsentResult> {
    return appConsentService.getConsentStatus(tenantId, candidateId, actorId, actorType, channel, ipAddress) as Promise<ConsentResult>;
  }

  async withdrawConsent(tenantId: string, candidateId: string, reason: string | undefined, actorId: string, actorType: string, channel: string, ipAddress?: string, userAgent?: string): Promise<ConsentResult> {
    return appConsentService.withdrawConsent(tenantId, candidateId, reason, actorId, actorType, channel, ipAddress, userAgent) as Promise<ConsentResult>;
  }

  async checkDataReuse(tenantId: string, body: unknown, actorId: string, actorType: string, channel: string, ipAddress?: string): Promise<ConsentResult> {
    return appConsentService.checkDataReuse(tenantId, body, actorId, actorType, channel, ipAddress) as Promise<ConsentResult>;
  }
}
