/**
 * App Consent Reuse Tests
 * Task 1.6: Tests for consent capture, retrieval, and reuse enforcement
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppConsentService } from '../src/services/app-consent.service.js';
import type { ConsentDecision, ConsentScope } from '../src/models/app-consent.model.js';

// Mock the repository
vi.mock('../src/repositories/app-consent.repository.js', () => ({
  appConsentRepository: {
    findByCandidateId: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    updateScopes: vi.fn(),
    withdraw: vi.fn(),
    markExpired: vi.fn(),
    findByTenant: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  },
}));

// Mock the audit service
vi.mock('../src/services/audit.service.js', () => ({
  auditService: {
    log: vi.fn(),
  },
}));

// Import after mocking
import { appConsentRepository } from '../src/repositories/app-consent.repository.js';
import { auditService } from '../src/services/audit.service.js';

describe('AppConsentService', () => {
  let service: AppConsentService;
  const tenantId = 'tenant-1';
  const candidateId = 'candidate-1';

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AppConsentService();
  });

  describe('captureConsent', () => {
    it('should capture new consent for candidate', async () => {
      const scopes: ConsentScope[] = ['identity', 'employment_history'];
      const mockConsent: ConsentDecision = {
        id: 'consent-1',
        tenantId,
        candidateId,
        scopes,
        status: 'granted',
        version: 1,
        consentedAt: new Date(),
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(appConsentRepository.findByCandidateId).mockResolvedValue(undefined);
      vi.mocked(appConsentRepository.create).mockResolvedValue(mockConsent);

      const result = await service.captureConsent(
        tenantId,
        candidateId,
        { scopes },
        candidateId,
        'candidate'
      );

      expect(result.success).toBe(true);
      expect(result.consent).toBeDefined();
      expect(result.consent?.scopes).toEqual(scopes);
      expect(result.consent?.status).toBe('granted');
      expect(appConsentRepository.create).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CONSENT_GRANTED',
          success: true,
        })
      );
    });

    it('should update existing consent with new scopes', async () => {
      const existingScopes: ConsentScope[] = ['identity'];
      const newScopes: ConsentScope[] = ['identity', 'employment_history', 'references'];
      const existingConsent: ConsentDecision = {
        id: 'consent-1',
        tenantId,
        candidateId,
        scopes: existingScopes,
        status: 'granted',
        version: 1,
        consentedAt: new Date(),
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedConsent: ConsentDecision = {
        ...existingConsent,
        scopes: newScopes,
        version: 2,
        updatedAt: new Date(),
      };

      vi.mocked(appConsentRepository.findByCandidateId).mockResolvedValue(existingConsent);
      vi.mocked(appConsentRepository.updateScopes).mockResolvedValue(updatedConsent);

      const result = await service.captureConsent(
        tenantId,
        candidateId,
        { scopes: newScopes },
        candidateId,
        'candidate'
      );

      expect(result.success).toBe(true);
      expect(result.consent?.scopes).toEqual(newScopes);
      expect(result.consent?.version).toBe(2);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CONSENT_UPDATED',
          metadata: expect.objectContaining({
            previousScopes: existingScopes,
            newScopes,
          }),
        })
      );
    });

    it('should deny consent capture by non-candidate', async () => {
      const scopes: ConsentScope[] = ['identity'];

      const result = await service.captureConsent(
        tenantId,
        candidateId,
        { scopes },
        'user-1',
        'user' // Not a candidate
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('FORBIDDEN');
      expect(appConsentRepository.create).not.toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CONSENT_ACCESS_DENIED',
          success: false,
        })
      );
    });

    it('should deny consent capture for different candidate', async () => {
      const scopes: ConsentScope[] = ['identity'];
      const otherCandidateId = 'other-candidate';

      const result = await service.captureConsent(
        tenantId,
        otherCandidateId, // Trying to capture for a different candidate
        { scopes },
        candidateId,
        'candidate'
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('FORBIDDEN');
    });

    it('should capture consent with custom expiry', async () => {
      const scopes: ConsentScope[] = ['identity'];
      const expiresInDays = 30;
      const mockConsent: ConsentDecision = {
        id: 'consent-1',
        tenantId,
        candidateId,
        scopes,
        status: 'granted',
        version: 1,
        consentedAt: new Date(),
        expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(appConsentRepository.findByCandidateId).mockResolvedValue(undefined);
      vi.mocked(appConsentRepository.create).mockResolvedValue(mockConsent);

      const result = await service.captureConsent(
        tenantId,
        candidateId,
        { scopes, expiresInDays },
        candidateId,
        'candidate'
      );

      expect(result.success).toBe(true);
      expect(appConsentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          scopes,
          expiresAt: expect.any(Date),
        })
      );
    });
  });

  describe('getConsentStatus', () => {
    it('should return consent status for own candidate', async () => {
      const mockConsent: ConsentDecision = {
        id: 'consent-1',
        tenantId,
        candidateId,
        scopes: ['identity', 'employment_history'],
        status: 'granted',
        version: 1,
        consentedAt: new Date(),
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(appConsentRepository.findByCandidateId).mockResolvedValue(mockConsent);

      const result = await service.getConsentStatus(
        tenantId,
        candidateId,
        candidateId,
        'candidate'
      );

      expect(result.success).toBe(true);
      expect(result.consent).toBeDefined();
      expect(result.consent?.status).toBe('granted');
    });

    it('should return no consent when none exists', async () => {
      vi.mocked(appConsentRepository.findByCandidateId).mockResolvedValue(undefined);

      const result = await service.getConsentStatus(
        tenantId,
        candidateId,
        candidateId,
        'candidate'
      );

      expect(result.success).toBe(true);
      expect(result.consent).toBeUndefined();
    });

    it('should allow admin to view any candidate consent', async () => {
      const mockConsent: ConsentDecision = {
        id: 'consent-1',
        tenantId,
        candidateId,
        scopes: ['identity'],
        status: 'granted',
        version: 1,
        consentedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(appConsentRepository.findByCandidateId).mockResolvedValue(mockConsent);

      const result = await service.getConsentStatus(
        tenantId,
        candidateId,
        'admin-user-1',
        'user' // Admin can view any candidate
      );

      expect(result.success).toBe(true);
      expect(result.consent).toBeDefined();
    });

    it('should deny candidate from viewing another candidate consent', async () => {
      const otherCandidateId = 'other-candidate';

      const result = await service.getConsentStatus(
        tenantId,
        otherCandidateId,
        candidateId,
        'candidate'
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('FORBIDDEN');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CONSENT_ACCESS_DENIED',
          success: false,
        })
      );
    });

    it('should detect and mark expired consent', async () => {
      const expiredConsent: ConsentDecision = {
        id: 'consent-1',
        tenantId,
        candidateId,
        scopes: ['identity'],
        status: 'granted',
        version: 1,
        consentedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // Expired 20 days ago
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const markedExpired: ConsentDecision = {
        ...expiredConsent,
        status: 'expired',
      };

      vi.mocked(appConsentRepository.findByCandidateId)
        .mockResolvedValueOnce(expiredConsent)
        .mockResolvedValueOnce(markedExpired);
      vi.mocked(appConsentRepository.markExpired).mockResolvedValue(markedExpired);

      const result = await service.getConsentStatus(
        tenantId,
        candidateId,
        candidateId,
        'candidate'
      );

      expect(result.success).toBe(true);
      expect(result.consent?.status).toBe('expired');
      expect(appConsentRepository.markExpired).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CONSENT_EXPIRED',
        })
      );
    });
  });

  describe('checkDataReuse', () => {
    it('should allow data reuse when consent covers requested scopes', async () => {
      const mockConsent: ConsentDecision = {
        id: 'consent-1',
        tenantId,
        candidateId,
        scopes: ['identity', 'employment_history', 'references'],
        status: 'granted',
        version: 1,
        consentedAt: new Date(),
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(appConsentRepository.findByCandidateId).mockResolvedValue(mockConsent);

      const result = await service.checkDataReuse(
        tenantId,
        {
          candidateId,
          targetScreeningId: 'screening-2',
          requestedScopes: ['identity', 'employment_history'],
        },
        'admin-user',
        'user'
      );

      expect(result.success).toBe(true);
      expect(result.response?.allowed).toBe(true);
      expect(result.response?.grantedScopes).toEqual(['identity', 'employment_history']);
      expect(result.response?.deniedScopes).toEqual([]);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CONSENT_REUSE_ALLOWED',
          success: true,
        })
      );
    });

    it('should allow all scopes when consent has "all"', async () => {
      const mockConsent: ConsentDecision = {
        id: 'consent-1',
        tenantId,
        candidateId,
        scopes: ['all'],
        status: 'granted',
        version: 1,
        consentedAt: new Date(),
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(appConsentRepository.findByCandidateId).mockResolvedValue(mockConsent);

      const result = await service.checkDataReuse(
        tenantId,
        {
          candidateId,
          targetScreeningId: 'screening-2',
          requestedScopes: ['identity', 'background_check', 'drug_screening'],
        },
        'admin-user',
        'user'
      );

      expect(result.success).toBe(true);
      expect(result.response?.allowed).toBe(true);
      expect(result.response?.grantedScopes).toEqual(['identity', 'background_check', 'drug_screening']);
    });

    it('should deny data reuse when consent does not cover all scopes', async () => {
      const mockConsent: ConsentDecision = {
        id: 'consent-1',
        tenantId,
        candidateId,
        scopes: ['identity'],
        status: 'granted',
        version: 1,
        consentedAt: new Date(),
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(appConsentRepository.findByCandidateId).mockResolvedValue(mockConsent);

      const result = await service.checkDataReuse(
        tenantId,
        {
          candidateId,
          targetScreeningId: 'screening-2',
          requestedScopes: ['identity', 'background_check'],
        },
        'admin-user',
        'user'
      );

      expect(result.success).toBe(true);
      expect(result.response?.allowed).toBe(false);
      expect(result.response?.grantedScopes).toEqual(['identity']);
      expect(result.response?.deniedScopes).toEqual(['background_check']);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CONSENT_REUSE_DENIED',
          metadata: expect.objectContaining({
            reason: 'scope_mismatch',
          }),
        })
      );
    });

    it('should deny data reuse when no consent exists', async () => {
      vi.mocked(appConsentRepository.findByCandidateId).mockResolvedValue(undefined);

      const result = await service.checkDataReuse(
        tenantId,
        {
          candidateId,
          targetScreeningId: 'screening-2',
          requestedScopes: ['identity'],
        },
        'admin-user',
        'user'
      );

      expect(result.success).toBe(true);
      expect(result.response?.allowed).toBe(false);
      expect(result.response?.reason).toBe('No consent found for candidate');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CONSENT_REUSE_DENIED',
          metadata: expect.objectContaining({
            reason: 'no_consent',
          }),
        })
      );
    });

    it('should deny data reuse when consent is withdrawn', async () => {
      const withdrawnConsent: ConsentDecision = {
        id: 'consent-1',
        tenantId,
        candidateId,
        scopes: ['identity', 'employment_history'],
        status: 'withdrawn',
        version: 1,
        consentedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        withdrawnAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(appConsentRepository.findByCandidateId).mockResolvedValue(withdrawnConsent);

      const result = await service.checkDataReuse(
        tenantId,
        {
          candidateId,
          targetScreeningId: 'screening-2',
          requestedScopes: ['identity'],
        },
        'admin-user',
        'user'
      );

      expect(result.success).toBe(true);
      expect(result.response?.allowed).toBe(false);
      expect(result.response?.reason).toBe('Consent has been withdrawn');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CONSENT_REUSE_DENIED',
          metadata: expect.objectContaining({
            reason: 'consent_withdrawn',
          }),
        })
      );
    });

    it('should deny data reuse when consent is expired', async () => {
      const expiredConsent: ConsentDecision = {
        id: 'consent-1',
        tenantId,
        candidateId,
        scopes: ['identity', 'employment_history'],
        status: 'granted',
        version: 1,
        consentedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // Expired
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(appConsentRepository.findByCandidateId).mockResolvedValue(expiredConsent);
      vi.mocked(appConsentRepository.markExpired).mockResolvedValue({
        ...expiredConsent,
        status: 'expired',
      });

      const result = await service.checkDataReuse(
        tenantId,
        {
          candidateId,
          targetScreeningId: 'screening-2',
          requestedScopes: ['identity'],
        },
        'admin-user',
        'user'
      );

      expect(result.success).toBe(true);
      expect(result.response?.allowed).toBe(false);
      expect(result.response?.reason).toBe('Consent has expired');
      expect(appConsentRepository.markExpired).toHaveBeenCalled();
    });
  });

  describe('withdrawConsent', () => {
    it('should allow candidate to withdraw their own consent', async () => {
      const mockConsent: ConsentDecision = {
        id: 'consent-1',
        tenantId,
        candidateId,
        scopes: ['identity', 'employment_history'],
        status: 'granted',
        version: 1,
        consentedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(appConsentRepository.findByCandidateId).mockResolvedValue(mockConsent);
      vi.mocked(appConsentRepository.withdraw).mockResolvedValue({
        ...mockConsent,
        status: 'withdrawn',
        withdrawnAt: new Date(),
      });

      const result = await service.withdrawConsent(
        tenantId,
        candidateId,
        'Changed my mind',
        candidateId,
        'candidate'
      );

      expect(result.success).toBe(true);
      expect(appConsentRepository.withdraw).toHaveBeenCalledWith(
        tenantId,
        candidateId,
        'Changed my mind'
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'CONSENT_WITHDRAWN',
          success: true,
          metadata: expect.objectContaining({
            withdrawalReason: 'Changed my mind',
          }),
        })
      );
    });

    it('should deny withdrawal by non-candidate', async () => {
      const result = await service.withdrawConsent(
        tenantId,
        candidateId,
        undefined,
        'admin-user',
        'user' // Not a candidate
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('FORBIDDEN');
      expect(appConsentRepository.withdraw).not.toHaveBeenCalled();
    });

    it('should deny withdrawal for different candidate', async () => {
      const otherCandidateId = 'other-candidate';

      const result = await service.withdrawConsent(
        tenantId,
        otherCandidateId,
        undefined,
        candidateId,
        'candidate'
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('FORBIDDEN');
    });

    it('should return NOT_FOUND when no consent exists', async () => {
      vi.mocked(appConsentRepository.findByCandidateId).mockResolvedValue(undefined);

      const result = await service.withdrawConsent(
        tenantId,
        candidateId,
        undefined,
        candidateId,
        'candidate'
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should return ALREADY_WITHDRAWN when consent already withdrawn', async () => {
      const withdrawnConsent: ConsentDecision = {
        id: 'consent-1',
        tenantId,
        candidateId,
        scopes: ['identity'],
        status: 'withdrawn',
        version: 1,
        consentedAt: new Date(),
        withdrawnAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(appConsentRepository.findByCandidateId).mockResolvedValue(withdrawnConsent);

      const result = await service.withdrawConsent(
        tenantId,
        candidateId,
        undefined,
        candidateId,
        'candidate'
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('ALREADY_WITHDRAWN');
    });
  });
});
