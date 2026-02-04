/**
 * App Consent Service
 * Task 1.2-1.5: Consent storage, retrieval, enforcement, and audit logging
 */

import type {
  ConsentDecision,
  ConsentScope,
  ConsentStatusResponse,
  ConsentCaptureRequest,
  DataReuseRequest,
  DataReuseResponse,
} from '../models/app-consent.model.js';
import {
  DEFAULT_CONSENT_EXPIRY_DAYS,
  isConsentExpired,
  hasRequiredScopes,
} from '../models/app-consent.model.js';
import { appConsentRepository } from '../repositories/app-consent.repository.js';
import { auditService } from './audit.service.js';

export interface ConsentCaptureResult {
  success: boolean;
  consent?: ConsentStatusResponse;
  error?: string;
  errorCode?: string;
}

export interface ConsentRetrievalResult {
  success: boolean;
  consent?: ConsentStatusResponse;
  error?: string;
  errorCode?: string;
}

export interface ConsentWithdrawalResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

export interface DataReuseResult {
  success: boolean;
  response?: DataReuseResponse;
  error?: string;
  errorCode?: string;
}

/**
 * Convert internal consent to API response format
 */
function toConsentStatusResponse(consent: ConsentDecision): ConsentStatusResponse {
  return {
    candidateId: consent.candidateId,
    scopes: consent.scopes,
    status: consent.status,
    version: consent.version,
    consentedAt: consent.consentedAt.toISOString(),
    expiresAt: consent.expiresAt?.toISOString(),
    withdrawnAt: consent.withdrawnAt?.toISOString(),
  };
}

export class AppConsentService {
  /**
   * Task 1.1, 1.2: Capture consent decision from the app
   */
  async captureConsent(
    tenantId: string,
    candidateId: string,
    request: ConsentCaptureRequest,
    actorId: string,
    actorType: 'user' | 'candidate',
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string,
    userAgent?: string
  ): Promise<ConsentCaptureResult> {
    // Only the candidate themselves can grant consent
    if (actorType !== 'candidate' || actorId !== candidateId) {
      auditService.log({
        eventType: 'CONSENT_ACCESS_DENIED',
        actorId,
        actorType,
        targetId: candidateId,
        targetType: 'candidate',
        channel,
        ipAddress,
        userAgent,
        metadata: { reason: 'Only candidates can grant their own consent' },
        success: false,
        errorMessage: 'Only candidates can grant their own consent',
      });

      return {
        success: false,
        error: 'Only candidates can grant their own consent',
        errorCode: 'FORBIDDEN',
      };
    }

    const expiryDays = request.expiresInDays ?? DEFAULT_CONSENT_EXPIRY_DAYS;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Check for existing consent
    const existing = await appConsentRepository.findByCandidateId(tenantId, candidateId);

    let consent: ConsentDecision;

    if (existing && existing.status === 'granted' && !isConsentExpired(existing)) {
      // Update existing consent
      const updated = await appConsentRepository.updateScopes(
        tenantId,
        candidateId,
        request.scopes,
        expiresAt,
        ipAddress,
        userAgent
      );

      if (!updated) {
        return {
          success: false,
          error: 'Failed to update consent',
          errorCode: 'INTERNAL_ERROR',
        };
      }

      consent = updated;

      auditService.log({
        eventType: 'CONSENT_UPDATED',
        actorId: candidateId,
        actorType: 'candidate',
        targetId: consent.id,
        targetType: 'consent',
        channel,
        ipAddress,
        userAgent,
        metadata: {
          previousScopes: existing.scopes,
          newScopes: request.scopes,
          previousVersion: existing.version,
          newVersion: consent.version,
          screeningId: request.screeningId,
        },
        success: true,
      });
    } else {
      // Create new consent
      consent = await appConsentRepository.create({
        tenantId,
        candidateId,
        screeningId: request.screeningId,
        scopes: request.scopes,
        expiresAt,
        ipAddress,
        userAgent,
        metadata: request.metadata,
      });

      auditService.log({
        eventType: 'CONSENT_GRANTED',
        actorId: candidateId,
        actorType: 'candidate',
        targetId: consent.id,
        targetType: 'consent',
        channel,
        ipAddress,
        userAgent,
        metadata: {
          scopes: request.scopes,
          version: consent.version,
          expiresAt: expiresAt.toISOString(),
          screeningId: request.screeningId,
        },
        success: true,
      });
    }

    return {
      success: true,
      consent: toConsentStatusResponse(consent),
    };
  }

  /**
   * Task 1.3: Retrieve consent status for prefill decisions
   */
  async getConsentStatus(
    tenantId: string,
    candidateId: string,
    actorId: string,
    actorType: 'user' | 'candidate',
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string
  ): Promise<ConsentRetrievalResult> {
    // Candidates can only view their own consent
    // Users (admins) can view any candidate's consent
    if (actorType === 'candidate' && actorId !== candidateId) {
      auditService.log({
        eventType: 'CONSENT_ACCESS_DENIED',
        actorId,
        actorType,
        targetId: candidateId,
        targetType: 'candidate',
        channel,
        ipAddress,
        metadata: { reason: 'Candidates can only view their own consent' },
        success: false,
        errorMessage: 'Candidates can only view their own consent',
      });

      return {
        success: false,
        error: 'Cannot access another candidate\'s consent',
        errorCode: 'FORBIDDEN',
      };
    }

    const consent = await appConsentRepository.findByCandidateId(tenantId, candidateId);

    if (!consent) {
      return {
        success: true,
        consent: undefined, // No consent found is a valid state
      };
    }

    // Check for expiry and update status if needed
    if (consent.status === 'granted' && isConsentExpired(consent)) {
      await appConsentRepository.markExpired(tenantId, candidateId);

      auditService.log({
        eventType: 'CONSENT_EXPIRED',
        actorId: 'system',
        actorType: 'system',
        targetId: consent.id,
        targetType: 'consent',
        channel,
        metadata: {
          candidateId,
          expiredAt: consent.expiresAt?.toISOString(),
        },
        success: true,
      });

      // Return updated status
      const updated = await appConsentRepository.findByCandidateId(tenantId, candidateId);
      return {
        success: true,
        consent: updated ? toConsentStatusResponse(updated) : undefined,
      };
    }

    return {
      success: true,
      consent: toConsentStatusResponse(consent),
    };
  }

  /**
   * Task 1.4: Enforce data reuse based on consent scope
   */
  async checkDataReuse(
    tenantId: string,
    request: DataReuseRequest,
    actorId: string,
    actorType: 'user' | 'candidate',
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string
  ): Promise<DataReuseResult> {
    const consent = await appConsentRepository.findByCandidateId(
      tenantId,
      request.candidateId
    );

    // No consent found
    if (!consent) {
      auditService.log({
        eventType: 'CONSENT_REUSE_DENIED',
        actorId,
        actorType,
        targetId: request.candidateId,
        targetType: 'candidate',
        channel,
        ipAddress,
        metadata: {
          reason: 'no_consent',
          requestedScopes: request.requestedScopes,
          targetScreeningId: request.targetScreeningId,
        },
        success: false,
        errorMessage: 'No consent found for candidate',
      });

      return {
        success: true,
        response: {
          allowed: false,
          grantedScopes: [],
          deniedScopes: request.requestedScopes,
          reason: 'No consent found for candidate',
        },
      };
    }

    // Consent withdrawn
    if (consent.status === 'withdrawn') {
      auditService.log({
        eventType: 'CONSENT_REUSE_DENIED',
        actorId,
        actorType,
        targetId: request.candidateId,
        targetType: 'candidate',
        channel,
        ipAddress,
        metadata: {
          reason: 'consent_withdrawn',
          requestedScopes: request.requestedScopes,
          targetScreeningId: request.targetScreeningId,
          withdrawnAt: consent.withdrawnAt?.toISOString(),
        },
        success: false,
        errorMessage: 'Consent has been withdrawn',
      });

      return {
        success: true,
        response: {
          allowed: false,
          grantedScopes: [],
          deniedScopes: request.requestedScopes,
          reason: 'Consent has been withdrawn',
        },
      };
    }

    // Check expiry
    if (isConsentExpired(consent)) {
      await appConsentRepository.markExpired(tenantId, request.candidateId);

      auditService.log({
        eventType: 'CONSENT_REUSE_DENIED',
        actorId,
        actorType,
        targetId: request.candidateId,
        targetType: 'candidate',
        channel,
        ipAddress,
        metadata: {
          reason: 'consent_expired',
          requestedScopes: request.requestedScopes,
          targetScreeningId: request.targetScreeningId,
          expiredAt: consent.expiresAt?.toISOString(),
        },
        success: false,
        errorMessage: 'Consent has expired',
      });

      return {
        success: true,
        response: {
          allowed: false,
          grantedScopes: [],
          deniedScopes: request.requestedScopes,
          reason: 'Consent has expired',
        },
      };
    }

    // Determine which scopes are granted vs denied
    const grantedScopes: ConsentScope[] = [];
    const deniedScopes: ConsentScope[] = [];

    for (const scope of request.requestedScopes) {
      if (hasRequiredScopes(consent.scopes, [scope])) {
        grantedScopes.push(scope);
      } else {
        deniedScopes.push(scope);
      }
    }

    const allowed = deniedScopes.length === 0;

    if (allowed) {
      auditService.log({
        eventType: 'CONSENT_REUSE_ALLOWED',
        actorId,
        actorType,
        targetId: request.candidateId,
        targetType: 'candidate',
        channel,
        ipAddress,
        metadata: {
          grantedScopes,
          targetScreeningId: request.targetScreeningId,
          consentVersion: consent.version,
        },
        success: true,
      });
    } else {
      auditService.log({
        eventType: 'CONSENT_REUSE_DENIED',
        actorId,
        actorType,
        targetId: request.candidateId,
        targetType: 'candidate',
        channel,
        ipAddress,
        metadata: {
          reason: 'scope_mismatch',
          grantedScopes,
          deniedScopes,
          requestedScopes: request.requestedScopes,
          consentedScopes: consent.scopes,
          targetScreeningId: request.targetScreeningId,
        },
        success: false,
        errorMessage: 'Not all requested scopes are covered by consent',
      });
    }

    return {
      success: true,
      response: {
        allowed,
        grantedScopes,
        deniedScopes,
        reason: allowed ? undefined : 'Not all requested scopes are covered by consent',
      },
    };
  }

  /**
   * Withdraw consent (candidate only)
   */
  async withdrawConsent(
    tenantId: string,
    candidateId: string,
    reason: string | undefined,
    actorId: string,
    actorType: 'user' | 'candidate',
    channel: 'web' | 'mobile' | 'api' = 'api',
    ipAddress?: string,
    userAgent?: string
  ): Promise<ConsentWithdrawalResult> {
    // Only the candidate themselves can withdraw consent
    if (actorType !== 'candidate' || actorId !== candidateId) {
      auditService.log({
        eventType: 'CONSENT_ACCESS_DENIED',
        actorId,
        actorType,
        targetId: candidateId,
        targetType: 'candidate',
        channel,
        ipAddress,
        userAgent,
        metadata: { reason: 'Only candidates can withdraw their own consent' },
        success: false,
        errorMessage: 'Only candidates can withdraw their own consent',
      });

      return {
        success: false,
        error: 'Only candidates can withdraw their own consent',
        errorCode: 'FORBIDDEN',
      };
    }

    const consent = await appConsentRepository.findByCandidateId(tenantId, candidateId);

    if (!consent) {
      return {
        success: false,
        error: 'No consent found',
        errorCode: 'NOT_FOUND',
      };
    }

    if (consent.status === 'withdrawn') {
      return {
        success: false,
        error: 'Consent already withdrawn',
        errorCode: 'ALREADY_WITHDRAWN',
      };
    }

    const previousScopes = consent.scopes;
    const previousStatus = consent.status;

    await appConsentRepository.withdraw(tenantId, candidateId, reason);

    auditService.log({
      eventType: 'CONSENT_WITHDRAWN',
      actorId: candidateId,
      actorType: 'candidate',
      targetId: consent.id,
      targetType: 'consent',
      channel,
      ipAddress,
      userAgent,
      metadata: {
        previousScopes,
        previousStatus,
        previousVersion: consent.version,
        withdrawalReason: reason,
      },
      success: true,
    });

    return {
      success: true,
    };
  }
}

export const appConsentService = new AppConsentService();
