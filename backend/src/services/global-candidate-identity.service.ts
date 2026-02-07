/**
 * Global Candidate Identity Service
 * Business logic for cross-tenant candidate identity, org assignments, and consent.
 */

import { globalCandidateRepository } from '../repositories/global-candidate.repository.js';
import { auditService } from './audit.service.js';
import { metricsService } from './metrics.service.js';
import {
  normalizeEmail,
  isConsentActive,
} from '../models/global-candidate-identity.model.js';
import type {
  GlobalCandidate,
  GlobalCandidateWithOrgs,
  CandidateOrgAssignment,
  CrossTenantConsent,
  CrossTenantConsentType,
  GlobalCandidateIdentityResult,
} from '../models/global-candidate-identity.model.js';

export class GlobalCandidateIdentityService {
  // ── Identity resolution ────────────────────────────────────────────────────

  /**
   * Resolve or create a global identity for a candidate.
   * If a global candidate with the same (normalized) email exists, create an org
   * assignment linking this tenant's local candidate to it. Otherwise create both.
   */
  async resolveOrCreateGlobalIdentity(
    email: string,
    firstName: string,
    lastName: string,
    tenantId: string,
    localCandidateId: string,
    addedBy: string
  ): Promise<GlobalCandidateIdentityResult<GlobalCandidate>> {
    try {
      const normalized = normalizeEmail(email);

      // 1. Check for existing global candidate
      let globalCandidate = await globalCandidateRepository.findByEmail(normalized);

      if (!globalCandidate) {
        // 2a. Create new global candidate
        globalCandidate = await globalCandidateRepository.create({
          email: normalized,
          firstName,
          lastName,
        });

        auditService.log({
          eventType: 'AUTH_SIGN_UP',
          actorId: addedBy,
          actorType: 'user',
          targetId: globalCandidate.id,
          targetType: 'global_candidate',
          channel: 'api',
          metadata: {
            operation: 'global_candidate_created',
            email: normalized,
            tenantId,
          },
          success: true,
        });
      }

      // 3. Check if assignment already exists for this tenant + local candidate
      const existingAssignment = await globalCandidateRepository.findOrgAssignment(
        globalCandidate.id,
        tenantId
      );

      if (!existingAssignment) {
        await globalCandidateRepository.createOrgAssignment({
          globalCandidateId: globalCandidate.id,
          tenantId,
          localCandidateId,
          addedBy,
        });

        auditService.log({
          eventType: 'GUARD_ACCESS_GRANTED',
          actorId: addedBy,
          actorType: 'user',
          targetId: globalCandidate.id,
          targetType: 'global_candidate',
          channel: 'api',
          metadata: {
            operation: 'org_assignment_created',
            tenantId,
            localCandidateId,
          },
          success: true,
        });
      }

      metricsService.incrementCounter('global_candidate_identity_resolved', {
        isNew: existingAssignment ? 'false' : 'true',
      });

      return { success: true, data: globalCandidate };
    } catch (error) {
      console.error('[GlobalCandidateIdentity] resolveOrCreate error:', error);
      return {
        success: false,
        error: 'Failed to resolve global identity',
        errorCode: 'INTERNAL_ERROR',
      };
    }
  }

  // ── Read operations ────────────────────────────────────────────────────────

  /**
   * Get a global candidate with all org assignments.
   */
  async getGlobalIdentity(
    globalCandidateId: string
  ): Promise<GlobalCandidateIdentityResult<GlobalCandidateWithOrgs>> {
    try {
      const candidate = await globalCandidateRepository.findById(globalCandidateId);
      if (!candidate) {
        return { success: false, error: 'Global candidate not found', errorCode: 'NOT_FOUND' };
      }

      const orgAssignments = await globalCandidateRepository.findOrgAssignments(globalCandidateId);

      return {
        success: true,
        data: { ...candidate, orgAssignments },
      };
    } catch (error) {
      console.error('[GlobalCandidateIdentity] getGlobalIdentity error:', error);
      return { success: false, error: 'Failed to get global identity', errorCode: 'INTERNAL_ERROR' };
    }
  }

  /**
   * Lookup a global candidate by email.
   */
  async lookupByEmail(
    email: string
  ): Promise<GlobalCandidateIdentityResult<GlobalCandidateWithOrgs>> {
    try {
      const candidate = await globalCandidateRepository.findByEmail(email);
      if (!candidate) {
        return { success: false, error: 'Global candidate not found', errorCode: 'NOT_FOUND' };
      }

      const orgAssignments = await globalCandidateRepository.findOrgAssignments(candidate.id);

      return {
        success: true,
        data: { ...candidate, orgAssignments },
      };
    } catch (error) {
      console.error('[GlobalCandidateIdentity] lookupByEmail error:', error);
      return { success: false, error: 'Failed to lookup by email', errorCode: 'INTERNAL_ERROR' };
    }
  }

  /**
   * List organisations a global candidate is assigned to.
   */
  async getOrganizationsForCandidate(
    globalCandidateId: string
  ): Promise<GlobalCandidateIdentityResult<CandidateOrgAssignment[]>> {
    try {
      const candidate = await globalCandidateRepository.findById(globalCandidateId);
      if (!candidate) {
        return { success: false, error: 'Global candidate not found', errorCode: 'NOT_FOUND' };
      }

      const assignments = await globalCandidateRepository.findOrgAssignments(globalCandidateId);
      return { success: true, data: assignments };
    } catch (error) {
      console.error('[GlobalCandidateIdentity] getOrganizations error:', error);
      return { success: false, error: 'Failed to get organizations', errorCode: 'INTERNAL_ERROR' };
    }
  }

  // ── Cross-tenant consent lifecycle ─────────────────────────────────────────

  /**
   * Request cross-org consent (status = pending).
   */
  async requestCrossOrgConsent(
    globalCandidateId: string,
    sourceOrgId: string,
    targetOrgId: string,
    consentType: CrossTenantConsentType
  ): Promise<GlobalCandidateIdentityResult<CrossTenantConsent>> {
    try {
      if (sourceOrgId === targetOrgId) {
        return {
          success: false,
          error: 'Source and target organizations must be different',
          errorCode: 'INVALID_INPUT',
        };
      }

      const candidate = await globalCandidateRepository.findById(globalCandidateId);
      if (!candidate) {
        return { success: false, error: 'Global candidate not found', errorCode: 'NOT_FOUND' };
      }

      // Check for existing consent with the same pair + type
      const existing = await globalCandidateRepository.findCrossOrgConsentByPair(
        globalCandidateId,
        sourceOrgId,
        targetOrgId,
        consentType
      );

      if (existing && (existing.status === 'pending' || existing.status === 'granted')) {
        return {
          success: false,
          error: `Consent already ${existing.status}`,
          errorCode: 'CONSENT_EXISTS',
        };
      }

      const consent = await globalCandidateRepository.createCrossOrgConsent({
        globalCandidateId,
        sourceOrgId,
        targetOrgId,
        consentType,
      });

      auditService.log({
        eventType: 'CONSENT_GRANTED',
        actorId: globalCandidateId,
        actorType: 'candidate',
        targetId: consent.id,
        targetType: 'cross_tenant_consent',
        channel: 'api',
        metadata: {
          operation: 'cross_org_consent_requested',
          sourceOrgId,
          targetOrgId,
          consentType,
        },
        success: true,
      });

      return { success: true, data: consent };
    } catch (error) {
      console.error('[GlobalCandidateIdentity] requestConsent error:', error);
      return { success: false, error: 'Failed to request consent', errorCode: 'INTERNAL_ERROR' };
    }
  }

  /**
   * Grant a pending consent.
   */
  async grantConsent(
    consentId: string
  ): Promise<GlobalCandidateIdentityResult<CrossTenantConsent>> {
    try {
      const consent = await globalCandidateRepository.findConsentById(consentId);
      if (!consent) {
        return { success: false, error: 'Consent not found', errorCode: 'NOT_FOUND' };
      }
      if (consent.status !== 'pending') {
        return {
          success: false,
          error: `Cannot grant consent in '${consent.status}' status`,
          errorCode: 'INVALID_STATUS',
        };
      }

      const now = new Date();
      // Default expiry: 1 year from now
      const expiresAt = new Date(now);
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      const updated = await globalCandidateRepository.updateCrossOrgConsent(consentId, {
        status: 'granted',
        grantedAt: now,
        expiresAt,
      });

      auditService.log({
        eventType: 'CONSENT_GRANTED',
        actorId: consent.globalCandidateId,
        actorType: 'candidate',
        targetId: consentId,
        targetType: 'cross_tenant_consent',
        channel: 'api',
        metadata: { operation: 'cross_org_consent_granted' },
        success: true,
      });

      return { success: true, data: updated! };
    } catch (error) {
      console.error('[GlobalCandidateIdentity] grantConsent error:', error);
      return { success: false, error: 'Failed to grant consent', errorCode: 'INTERNAL_ERROR' };
    }
  }

  /**
   * Deny a pending consent.
   */
  async denyConsent(
    consentId: string
  ): Promise<GlobalCandidateIdentityResult<CrossTenantConsent>> {
    try {
      const consent = await globalCandidateRepository.findConsentById(consentId);
      if (!consent) {
        return { success: false, error: 'Consent not found', errorCode: 'NOT_FOUND' };
      }
      if (consent.status !== 'pending') {
        return {
          success: false,
          error: `Cannot deny consent in '${consent.status}' status`,
          errorCode: 'INVALID_STATUS',
        };
      }

      const updated = await globalCandidateRepository.updateCrossOrgConsent(consentId, {
        status: 'denied',
      });

      auditService.log({
        eventType: 'CONSENT_WITHDRAWN',
        actorId: consent.globalCandidateId,
        actorType: 'candidate',
        targetId: consentId,
        targetType: 'cross_tenant_consent',
        channel: 'api',
        metadata: { operation: 'cross_org_consent_denied' },
        success: true,
      });

      return { success: true, data: updated! };
    } catch (error) {
      console.error('[GlobalCandidateIdentity] denyConsent error:', error);
      return { success: false, error: 'Failed to deny consent', errorCode: 'INTERNAL_ERROR' };
    }
  }

  /**
   * Revoke a previously granted consent.
   */
  async revokeConsent(
    consentId: string
  ): Promise<GlobalCandidateIdentityResult<CrossTenantConsent>> {
    try {
      const consent = await globalCandidateRepository.findConsentById(consentId);
      if (!consent) {
        return { success: false, error: 'Consent not found', errorCode: 'NOT_FOUND' };
      }
      if (consent.status !== 'granted') {
        return {
          success: false,
          error: `Cannot revoke consent in '${consent.status}' status`,
          errorCode: 'INVALID_STATUS',
        };
      }

      const updated = await globalCandidateRepository.updateCrossOrgConsent(consentId, {
        status: 'revoked',
        revokedAt: new Date(),
      });

      auditService.log({
        eventType: 'CONSENT_WITHDRAWN',
        actorId: consent.globalCandidateId,
        actorType: 'candidate',
        targetId: consentId,
        targetType: 'cross_tenant_consent',
        channel: 'api',
        metadata: { operation: 'cross_org_consent_revoked' },
        success: true,
      });

      return { success: true, data: updated! };
    } catch (error) {
      console.error('[GlobalCandidateIdentity] revokeConsent error:', error);
      return { success: false, error: 'Failed to revoke consent', errorCode: 'INTERNAL_ERROR' };
    }
  }

  // ── Data reuse ─────────────────────────────────────────────────────────────

  /**
   * Check whether data can be reused from sourceOrg → targetOrg for a candidate.
   * Returns the active consent if found.
   */
  async checkDataReuse(
    globalCandidateId: string,
    sourceOrgId: string,
    targetOrgId: string,
    consentType: CrossTenantConsentType
  ): Promise<GlobalCandidateIdentityResult<{ allowed: boolean; consent?: CrossTenantConsent }>> {
    try {
      const consent = await globalCandidateRepository.findCrossOrgConsentByPair(
        globalCandidateId,
        sourceOrgId,
        targetOrgId,
        consentType
      );

      if (!consent) {
        return { success: true, data: { allowed: false } };
      }

      const allowed = isConsentActive(consent);
      return { success: true, data: { allowed, consent } };
    } catch (error) {
      console.error('[GlobalCandidateIdentity] checkDataReuse error:', error);
      return { success: false, error: 'Failed to check data reuse', errorCode: 'INTERNAL_ERROR' };
    }
  }

  /**
   * Get all cross-org consents for a candidate.
   */
  async getCrossOrgConsents(
    globalCandidateId: string
  ): Promise<GlobalCandidateIdentityResult<CrossTenantConsent[]>> {
    try {
      const candidate = await globalCandidateRepository.findById(globalCandidateId);
      if (!candidate) {
        return { success: false, error: 'Global candidate not found', errorCode: 'NOT_FOUND' };
      }

      const consents = await globalCandidateRepository.findCrossOrgConsents(globalCandidateId);
      return { success: true, data: consents };
    } catch (error) {
      console.error('[GlobalCandidateIdentity] getCrossOrgConsents error:', error);
      return { success: false, error: 'Failed to get consents', errorCode: 'INTERNAL_ERROR' };
    }
  }
}

export const globalCandidateIdentityService = new GlobalCandidateIdentityService();
