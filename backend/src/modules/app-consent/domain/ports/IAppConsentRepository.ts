/**
 * App Consent Repository Port
 */

import type { ConsentResult } from '../entities/app-consent.entity.js';

export interface IAppConsentRepository {
  captureConsent(tenantId: string, candidateId: string, body: unknown, actorId: string, actorType: string, channel: string, ipAddress?: string, userAgent?: string): Promise<ConsentResult>;
  getConsentStatus(tenantId: string, candidateId: string, actorId: string, actorType: string, channel: string, ipAddress?: string): Promise<ConsentResult>;
  withdrawConsent(tenantId: string, candidateId: string, reason: string | undefined, actorId: string, actorType: string, channel: string, ipAddress?: string, userAgent?: string): Promise<ConsentResult>;
  checkDataReuse(tenantId: string, body: unknown, actorId: string, actorType: string, channel: string, ipAddress?: string): Promise<ConsentResult>;
}
