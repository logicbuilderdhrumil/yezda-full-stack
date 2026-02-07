/**
 * Global Candidate Identity Tests
 * Tests for global identity resolution, org assignments, and cross-org consent lifecycle.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { globalCandidateIdentityService } from '../src/services/global-candidate-identity.service.js';
import { globalCandidateRepository } from '../src/repositories/global-candidate.repository.js';
import {
  normalizeEmail,
  isConsentActive,
} from '../src/models/global-candidate-identity.model.js';
import type {
  GlobalCandidate,
  CandidateOrgAssignment,
  CrossTenantConsent,
  CrossTenantConsentType,
} from '../src/models/global-candidate-identity.model.js';

// Mock the repository
vi.mock('../src/repositories/global-candidate.repository.js', () => {
  // In-memory stores for the mock
  const candidates = new Map<string, GlobalCandidate>();
  const emailIdx = new Map<string, string>();
  const assignments = new Map<string, CandidateOrgAssignment>();
  const consents = new Map<string, CrossTenantConsent>();

  let idCounter = 0;
  function nextId(): string {
    idCounter++;
    return `00000000-0000-0000-0000-${String(idCounter).padStart(12, '0')}`;
  }

  const repo = {
    findById: vi.fn(async (id: string) => candidates.get(id)),

    findByEmail: vi.fn(async (email: string) => {
      const normalized = email.trim().toLowerCase();
      const gid = emailIdx.get(normalized);
      return gid ? candidates.get(gid) : undefined;
    }),

    create: vi.fn(async (input: { email: string; firstName: string; lastName: string }) => {
      const normalized = input.email.trim().toLowerCase();
      const now = new Date();
      const c: GlobalCandidate = {
        id: nextId(),
        email: input.email,
        normalizedEmail: normalized,
        firstName: input.firstName,
        lastName: input.lastName,
        createdAt: now,
        updatedAt: now,
      };
      candidates.set(c.id, c);
      emailIdx.set(normalized, c.id);
      return c;
    }),

    update: vi.fn(async (id: string, data: Partial<GlobalCandidate>) => {
      const c = candidates.get(id);
      if (!c) return undefined;
      const updated = { ...c, ...data, updatedAt: new Date() };
      candidates.set(id, updated);
      return updated;
    }),

    findOrgAssignments: vi.fn(async (gid: string) => {
      const result: CandidateOrgAssignment[] = [];
      for (const a of assignments.values()) {
        if (a.globalCandidateId === gid) result.push(a);
      }
      return result;
    }),

    findByLocalCandidate: vi.fn(async (tenantId: string, localCandidateId: string) => {
      for (const a of assignments.values()) {
        if (a.tenantId === tenantId && a.localCandidateId === localCandidateId) return a;
      }
      return undefined;
    }),

    findOrgAssignment: vi.fn(async (gid: string, tenantId: string) => {
      for (const a of assignments.values()) {
        if (a.globalCandidateId === gid && a.tenantId === tenantId) return a;
      }
      return undefined;
    }),

    createOrgAssignment: vi.fn(
      async (input: { globalCandidateId: string; tenantId: string; localCandidateId: string; addedBy: string }) => {
        const now = new Date();
        const a: CandidateOrgAssignment = {
          id: nextId(),
          globalCandidateId: input.globalCandidateId,
          tenantId: input.tenantId,
          localCandidateId: input.localCandidateId,
          status: 'active',
          addedBy: input.addedBy,
          addedAt: now,
          createdAt: now,
          updatedAt: now,
        };
        assignments.set(a.id, a);
        return a;
      }
    ),

    findConsentById: vi.fn(async (id: string) => consents.get(id)),

    findCrossOrgConsents: vi.fn(async (gid: string) => {
      const result: CrossTenantConsent[] = [];
      for (const c of consents.values()) {
        if (c.globalCandidateId === gid) result.push(c);
      }
      return result;
    }),

    findCrossOrgConsentByPair: vi.fn(
      async (gid: string, sourceOrgId: string, targetOrgId: string, consentType: string) => {
        for (const c of consents.values()) {
          if (
            c.globalCandidateId === gid &&
            c.sourceOrgId === sourceOrgId &&
            c.targetOrgId === targetOrgId &&
            c.consentType === consentType
          ) {
            return c;
          }
        }
        return undefined;
      }
    ),

    createCrossOrgConsent: vi.fn(
      async (input: {
        globalCandidateId: string;
        sourceOrgId: string;
        targetOrgId: string;
        consentType: CrossTenantConsentType;
      }) => {
        const now = new Date();
        const consent: CrossTenantConsent = {
          id: nextId(),
          globalCandidateId: input.globalCandidateId,
          sourceOrgId: input.sourceOrgId,
          targetOrgId: input.targetOrgId,
          consentType: input.consentType,
          status: 'pending',
          createdAt: now,
          updatedAt: now,
        };
        consents.set(consent.id, consent);
        return consent;
      }
    ),

    updateCrossOrgConsent: vi.fn(
      async (id: string, data: Partial<CrossTenantConsent>) => {
        const c = consents.get(id);
        if (!c) return undefined;
        const updated = { ...c, ...data, updatedAt: new Date() };
        consents.set(id, updated);
        return updated;
      }
    ),

    clear: vi.fn(async () => {
      candidates.clear();
      emailIdx.clear();
      assignments.clear();
      consents.clear();
      idCounter = 0;
    }),
  };

  return { globalCandidateRepository: repo, GlobalCandidateRepository: vi.fn(() => repo) };
});

// ── Helpers ──────────────────────────────────────────────────────────────────

const TENANT_A = 'aaaaaaaa-0000-0000-0000-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-0000-0000-0000-bbbbbbbbbbbb';
const ADMIN_A = 'admin-aaa';
const ADMIN_B = 'admin-bbb';
const LOCAL_CANDIDATE_A = 'local-candidate-aaa';
const LOCAL_CANDIDATE_B = 'local-candidate-bbb';

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Global Candidate Identity — Model helpers', () => {
  describe('normalizeEmail', () => {
    it('should lowercase and trim email', () => {
      expect(normalizeEmail('  Alice@Example.COM  ')).toBe('alice@example.com');
    });

    it('should handle already normalized email', () => {
      expect(normalizeEmail('test@example.com')).toBe('test@example.com');
    });

    it('should strip leading/trailing whitespace', () => {
      expect(normalizeEmail('  bob@example.com ')).toBe('bob@example.com');
    });
  });

  describe('isConsentActive', () => {
    it('should return true for granted + not expired', () => {
      const future = new Date();
      future.setFullYear(future.getFullYear() + 1);
      expect(
        isConsentActive({
          status: 'granted',
          expiresAt: future,
        } as CrossTenantConsent)
      ).toBe(true);
    });

    it('should return false for granted + expired', () => {
      const past = new Date('2020-01-01');
      expect(
        isConsentActive({
          status: 'granted',
          expiresAt: past,
        } as CrossTenantConsent)
      ).toBe(false);
    });

    it('should return false for non-granted status', () => {
      expect(
        isConsentActive({ status: 'pending' } as CrossTenantConsent)
      ).toBe(false);
      expect(
        isConsentActive({ status: 'denied' } as CrossTenantConsent)
      ).toBe(false);
      expect(
        isConsentActive({ status: 'revoked' } as CrossTenantConsent)
      ).toBe(false);
    });

    it('should return true for granted with no expiry', () => {
      expect(
        isConsentActive({ status: 'granted' } as CrossTenantConsent)
      ).toBe(true);
    });
  });
});

describe('Global Candidate Identity Service', () => {
  beforeEach(async () => {
    await globalCandidateRepository.clear();
  });

  // ── Identity Resolution ──────────────────────────────────────────────────

  describe('resolveOrCreateGlobalIdentity', () => {
    it('should create a new global candidate when email is new', async () => {
      const result = await globalCandidateIdentityService.resolveOrCreateGlobalIdentity(
        'alice@example.com',
        'Alice',
        'Smith',
        TENANT_A,
        LOCAL_CANDIDATE_A,
        ADMIN_A
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.normalizedEmail).toBe('alice@example.com');

      // Should also create org assignment
      const assignments = await globalCandidateRepository.findOrgAssignments(result.data!.id);
      expect(assignments.length).toBe(1);
      expect(assignments[0].tenantId).toBe(TENANT_A);
      expect(assignments[0].localCandidateId).toBe(LOCAL_CANDIDATE_A);
    });

    it('should resolve existing global candidate by email', async () => {
      // Create via tenant A
      const first = await globalCandidateIdentityService.resolveOrCreateGlobalIdentity(
        'bob@example.com',
        'Bob',
        'Jones',
        TENANT_A,
        LOCAL_CANDIDATE_A,
        ADMIN_A
      );

      // Resolve via tenant B — same email
      const second = await globalCandidateIdentityService.resolveOrCreateGlobalIdentity(
        'bob@example.com',
        'Bob',
        'Jones',
        TENANT_B,
        LOCAL_CANDIDATE_B,
        ADMIN_B
      );

      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
      // Same global candidate ID
      expect(second.data!.id).toBe(first.data!.id);

      // Two org assignments
      const assignments = await globalCandidateRepository.findOrgAssignments(first.data!.id);
      expect(assignments.length).toBe(2);
    });

    it('should normalise uppercase/whitespace emails to the same identity', async () => {
      const r1 = await globalCandidateIdentityService.resolveOrCreateGlobalIdentity(
        '  CAROL@Example.COM  ',
        'Carol',
        'White',
        TENANT_A,
        LOCAL_CANDIDATE_A,
        ADMIN_A
      );
      const r2 = await globalCandidateIdentityService.resolveOrCreateGlobalIdentity(
        'carol@example.com',
        'Carol',
        'White',
        TENANT_B,
        LOCAL_CANDIDATE_B,
        ADMIN_B
      );

      expect(r1.data!.id).toBe(r2.data!.id);
    });

    it('should not duplicate org assignment for same tenant', async () => {
      await globalCandidateIdentityService.resolveOrCreateGlobalIdentity(
        'dave@example.com',
        'Dave',
        'Brown',
        TENANT_A,
        LOCAL_CANDIDATE_A,
        ADMIN_A
      );

      // Call again for same tenant
      const r2 = await globalCandidateIdentityService.resolveOrCreateGlobalIdentity(
        'dave@example.com',
        'Dave',
        'Brown',
        TENANT_A,
        LOCAL_CANDIDATE_A,
        ADMIN_A
      );

      const assignments = await globalCandidateRepository.findOrgAssignments(r2.data!.id);
      expect(assignments.length).toBe(1);
    });
  });

  // ── Read operations ──────────────────────────────────────────────────────

  describe('getGlobalIdentity', () => {
    it('should return global candidate with org assignments', async () => {
      const created = await globalCandidateIdentityService.resolveOrCreateGlobalIdentity(
        'eve@example.com',
        'Eve',
        'Davis',
        TENANT_A,
        LOCAL_CANDIDATE_A,
        ADMIN_A
      );

      const result = await globalCandidateIdentityService.getGlobalIdentity(created.data!.id);
      expect(result.success).toBe(true);
      expect(result.data!.orgAssignments.length).toBe(1);
      expect(result.data!.firstName).toBe('Eve');
    });

    it('should return NOT_FOUND for unknown id', async () => {
      const result = await globalCandidateIdentityService.getGlobalIdentity('nonexistent-id');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });
  });

  describe('lookupByEmail', () => {
    it('should find candidate by email', async () => {
      await globalCandidateIdentityService.resolveOrCreateGlobalIdentity(
        'frank@example.com',
        'Frank',
        'Green',
        TENANT_A,
        LOCAL_CANDIDATE_A,
        ADMIN_A
      );

      const result = await globalCandidateIdentityService.lookupByEmail('frank@example.com');
      expect(result.success).toBe(true);
      expect(result.data!.normalizedEmail).toBe('frank@example.com');
    });

    it('should return NOT_FOUND for unknown email', async () => {
      const result = await globalCandidateIdentityService.lookupByEmail('nobody@example.com');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });
  });

  describe('getOrganizationsForCandidate', () => {
    it('should list all org assignments', async () => {
      const created = await globalCandidateIdentityService.resolveOrCreateGlobalIdentity(
        'grace@example.com',
        'Grace',
        'Hill',
        TENANT_A,
        LOCAL_CANDIDATE_A,
        ADMIN_A
      );

      await globalCandidateIdentityService.resolveOrCreateGlobalIdentity(
        'grace@example.com',
        'Grace',
        'Hill',
        TENANT_B,
        LOCAL_CANDIDATE_B,
        ADMIN_B
      );

      const result = await globalCandidateIdentityService.getOrganizationsForCandidate(created.data!.id);
      expect(result.success).toBe(true);
      expect(result.data!.length).toBe(2);
      expect(result.data!.map((a) => a.tenantId).sort()).toEqual([TENANT_A, TENANT_B].sort());
    });
  });

  // ── Cross-Org Consent Lifecycle ──────────────────────────────────────────

  describe('Cross-org consent lifecycle', () => {
    let globalCandidateId: string;

    beforeEach(async () => {
      const created = await globalCandidateIdentityService.resolveOrCreateGlobalIdentity(
        'henry@example.com',
        'Henry',
        'King',
        TENANT_A,
        LOCAL_CANDIDATE_A,
        ADMIN_A
      );
      globalCandidateId = created.data!.id;
    });

    it('should request consent (pending)', async () => {
      const result = await globalCandidateIdentityService.requestCrossOrgConsent(
        globalCandidateId,
        TENANT_A,
        TENANT_B,
        'screening_data'
      );

      expect(result.success).toBe(true);
      expect(result.data!.status).toBe('pending');
      expect(result.data!.sourceOrgId).toBe(TENANT_A);
      expect(result.data!.targetOrgId).toBe(TENANT_B);
      expect(result.data!.consentType).toBe('screening_data');
    });

    it('should reject consent when source === target', async () => {
      const result = await globalCandidateIdentityService.requestCrossOrgConsent(
        globalCandidateId,
        TENANT_A,
        TENANT_A,
        'screening_data'
      );

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_INPUT');
    });

    it('should reject duplicate pending consent', async () => {
      await globalCandidateIdentityService.requestCrossOrgConsent(
        globalCandidateId,
        TENANT_A,
        TENANT_B,
        'screening_data'
      );

      const dup = await globalCandidateIdentityService.requestCrossOrgConsent(
        globalCandidateId,
        TENANT_A,
        TENANT_B,
        'screening_data'
      );

      expect(dup.success).toBe(false);
      expect(dup.errorCode).toBe('CONSENT_EXISTS');
    });

    it('should grant pending consent', async () => {
      const requested = await globalCandidateIdentityService.requestCrossOrgConsent(
        globalCandidateId,
        TENANT_A,
        TENANT_B,
        'screening_data'
      );

      const granted = await globalCandidateIdentityService.grantConsent(requested.data!.id);
      expect(granted.success).toBe(true);
      expect(granted.data!.status).toBe('granted');
      expect(granted.data!.grantedAt).toBeDefined();
      expect(granted.data!.expiresAt).toBeDefined();
    });

    it('should deny pending consent', async () => {
      const requested = await globalCandidateIdentityService.requestCrossOrgConsent(
        globalCandidateId,
        TENANT_A,
        TENANT_B,
        'documents'
      );

      const denied = await globalCandidateIdentityService.denyConsent(requested.data!.id);
      expect(denied.success).toBe(true);
      expect(denied.data!.status).toBe('denied');
    });

    it('should revoke granted consent', async () => {
      const requested = await globalCandidateIdentityService.requestCrossOrgConsent(
        globalCandidateId,
        TENANT_A,
        TENANT_B,
        'full_profile'
      );
      await globalCandidateIdentityService.grantConsent(requested.data!.id);

      const revoked = await globalCandidateIdentityService.revokeConsent(requested.data!.id);
      expect(revoked.success).toBe(true);
      expect(revoked.data!.status).toBe('revoked');
      expect(revoked.data!.revokedAt).toBeDefined();
    });

    it('should not grant already granted consent', async () => {
      const requested = await globalCandidateIdentityService.requestCrossOrgConsent(
        globalCandidateId,
        TENANT_A,
        TENANT_B,
        'screening_data'
      );
      await globalCandidateIdentityService.grantConsent(requested.data!.id);

      const result = await globalCandidateIdentityService.grantConsent(requested.data!.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should not revoke non-granted consent', async () => {
      const requested = await globalCandidateIdentityService.requestCrossOrgConsent(
        globalCandidateId,
        TENANT_A,
        TENANT_B,
        'screening_data'
      );

      const result = await globalCandidateIdentityService.revokeConsent(requested.data!.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });

    it('should not deny non-pending consent', async () => {
      const requested = await globalCandidateIdentityService.requestCrossOrgConsent(
        globalCandidateId,
        TENANT_A,
        TENANT_B,
        'screening_data'
      );
      await globalCandidateIdentityService.grantConsent(requested.data!.id);

      const result = await globalCandidateIdentityService.denyConsent(requested.data!.id);
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_STATUS');
    });
  });

  // ── Data Reuse Check ─────────────────────────────────────────────────────

  describe('checkDataReuse', () => {
    let globalCandidateId: string;

    beforeEach(async () => {
      const created = await globalCandidateIdentityService.resolveOrCreateGlobalIdentity(
        'iris@example.com',
        'Iris',
        'Lee',
        TENANT_A,
        LOCAL_CANDIDATE_A,
        ADMIN_A
      );
      globalCandidateId = created.data!.id;
    });

    it('should return allowed=false when no consent exists', async () => {
      const result = await globalCandidateIdentityService.checkDataReuse(
        globalCandidateId,
        TENANT_A,
        TENANT_B,
        'screening_data'
      );

      expect(result.success).toBe(true);
      expect(result.data!.allowed).toBe(false);
    });

    it('should return allowed=true when consent is granted', async () => {
      const requested = await globalCandidateIdentityService.requestCrossOrgConsent(
        globalCandidateId,
        TENANT_A,
        TENANT_B,
        'screening_data'
      );
      await globalCandidateIdentityService.grantConsent(requested.data!.id);

      const result = await globalCandidateIdentityService.checkDataReuse(
        globalCandidateId,
        TENANT_A,
        TENANT_B,
        'screening_data'
      );

      expect(result.success).toBe(true);
      expect(result.data!.allowed).toBe(true);
      expect(result.data!.consent).toBeDefined();
    });

    it('should return allowed=false when consent is denied', async () => {
      const requested = await globalCandidateIdentityService.requestCrossOrgConsent(
        globalCandidateId,
        TENANT_A,
        TENANT_B,
        'screening_data'
      );
      await globalCandidateIdentityService.denyConsent(requested.data!.id);

      const result = await globalCandidateIdentityService.checkDataReuse(
        globalCandidateId,
        TENANT_A,
        TENANT_B,
        'screening_data'
      );

      expect(result.success).toBe(true);
      expect(result.data!.allowed).toBe(false);
    });

    it('should return allowed=false when consent is revoked', async () => {
      const requested = await globalCandidateIdentityService.requestCrossOrgConsent(
        globalCandidateId,
        TENANT_A,
        TENANT_B,
        'screening_data'
      );
      await globalCandidateIdentityService.grantConsent(requested.data!.id);
      await globalCandidateIdentityService.revokeConsent(requested.data!.id);

      const result = await globalCandidateIdentityService.checkDataReuse(
        globalCandidateId,
        TENANT_A,
        TENANT_B,
        'screening_data'
      );

      expect(result.success).toBe(true);
      expect(result.data!.allowed).toBe(false);
    });

    it('should return allowed=false when consent is pending', async () => {
      await globalCandidateIdentityService.requestCrossOrgConsent(
        globalCandidateId,
        TENANT_A,
        TENANT_B,
        'screening_data'
      );

      const result = await globalCandidateIdentityService.checkDataReuse(
        globalCandidateId,
        TENANT_A,
        TENANT_B,
        'screening_data'
      );

      expect(result.success).toBe(true);
      expect(result.data!.allowed).toBe(false);
    });
  });

  // ── getCrossOrgConsents ──────────────────────────────────────────────────

  describe('getCrossOrgConsents', () => {
    it('should return all consents for a candidate', async () => {
      const created = await globalCandidateIdentityService.resolveOrCreateGlobalIdentity(
        'jake@example.com',
        'Jake',
        'Martin',
        TENANT_A,
        LOCAL_CANDIDATE_A,
        ADMIN_A
      );

      await globalCandidateIdentityService.requestCrossOrgConsent(
        created.data!.id,
        TENANT_A,
        TENANT_B,
        'screening_data'
      );
      await globalCandidateIdentityService.requestCrossOrgConsent(
        created.data!.id,
        TENANT_A,
        TENANT_B,
        'documents'
      );

      const result = await globalCandidateIdentityService.getCrossOrgConsents(created.data!.id);
      expect(result.success).toBe(true);
      expect(result.data!.length).toBe(2);
    });

    it('should return NOT_FOUND for unknown candidate', async () => {
      const result = await globalCandidateIdentityService.getCrossOrgConsents('nonexistent-id');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });
  });

  // ── Validation edge cases ────────────────────────────────────────────────

  describe('Validation and error handling', () => {
    it('should return NOT_FOUND when granting unknown consent id', async () => {
      const result = await globalCandidateIdentityService.grantConsent('nonexistent-consent-id');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should return NOT_FOUND when denying unknown consent id', async () => {
      const result = await globalCandidateIdentityService.denyConsent('nonexistent-consent-id');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should return NOT_FOUND when revoking unknown consent id', async () => {
      const result = await globalCandidateIdentityService.revokeConsent('nonexistent-consent-id');
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });

    it('should return NOT_FOUND when requesting consent for unknown candidate', async () => {
      const result = await globalCandidateIdentityService.requestCrossOrgConsent(
        'nonexistent-candidate',
        TENANT_A,
        TENANT_B,
        'screening_data'
      );
      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('NOT_FOUND');
    });
  });
});
