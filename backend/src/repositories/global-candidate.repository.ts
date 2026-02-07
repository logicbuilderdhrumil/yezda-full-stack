/**
 * Global Candidate Repository
 * Persistence layer for global candidate identity, org assignments, and cross-tenant consent.
 * Uses in-memory stores (same pattern as app-consent.repository).
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  GlobalCandidate,
  CandidateOrgAssignment,
  CrossTenantConsent,
  CreateGlobalCandidateInput,
  UpdateGlobalCandidateInput,
  CreateOrgAssignmentInput,
  CreateCrossTenantConsentInput,
  UpdateCrossTenantConsentInput,
} from '../models/global-candidate-identity.model.js';
import { normalizeEmail } from '../models/global-candidate-identity.model.js';

// ── In-memory stores ───────────────────────────────────────────────────────────

const globalCandidateStore = new Map<string, GlobalCandidate>();
const orgAssignmentStore = new Map<string, CandidateOrgAssignment>();
const crossTenantConsentStore = new Map<string, CrossTenantConsent>();

// Secondary index: normalizedEmail → globalCandidateId
const emailIndex = new Map<string, string>();

export class GlobalCandidateRepository {
  // ── Global Candidate CRUD ──────────────────────────────────────────────────

  async findById(id: string): Promise<GlobalCandidate | undefined> {
    return globalCandidateStore.get(id);
  }

  async findByEmail(email: string): Promise<GlobalCandidate | undefined> {
    const normalized = normalizeEmail(email);
    const id = emailIndex.get(normalized);
    if (!id) return undefined;
    return globalCandidateStore.get(id);
  }

  async create(input: CreateGlobalCandidateInput): Promise<GlobalCandidate> {
    const now = new Date();
    const normalized = normalizeEmail(input.email);
    const candidate: GlobalCandidate = {
      id: uuidv4(),
      email: input.email,
      normalizedEmail: normalized,
      firstName: input.firstName,
      lastName: input.lastName,
      dateOfBirth: input.dateOfBirth,
      phoneNumber: input.phoneNumber,
      createdAt: now,
      updatedAt: now,
    };

    globalCandidateStore.set(candidate.id, candidate);
    emailIndex.set(normalized, candidate.id);
    return candidate;
  }

  async update(id: string, data: UpdateGlobalCandidateInput): Promise<GlobalCandidate | undefined> {
    const existing = globalCandidateStore.get(id);
    if (!existing) return undefined;

    const updated: GlobalCandidate = {
      ...existing,
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.dateOfBirth !== undefined && { dateOfBirth: data.dateOfBirth }),
      ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber }),
      updatedAt: new Date(),
    };

    globalCandidateStore.set(id, updated);
    return updated;
  }

  // ── Org Assignment ─────────────────────────────────────────────────────────

  async findOrgAssignments(globalCandidateId: string): Promise<CandidateOrgAssignment[]> {
    const results: CandidateOrgAssignment[] = [];
    for (const a of orgAssignmentStore.values()) {
      if (a.globalCandidateId === globalCandidateId) results.push(a);
    }
    return results;
  }

  async findByLocalCandidate(
    tenantId: string,
    localCandidateId: string
  ): Promise<CandidateOrgAssignment | undefined> {
    for (const a of orgAssignmentStore.values()) {
      if (a.tenantId === tenantId && a.localCandidateId === localCandidateId) return a;
    }
    return undefined;
  }

  async findOrgAssignment(
    globalCandidateId: string,
    tenantId: string
  ): Promise<CandidateOrgAssignment | undefined> {
    for (const a of orgAssignmentStore.values()) {
      if (a.globalCandidateId === globalCandidateId && a.tenantId === tenantId) return a;
    }
    return undefined;
  }

  async createOrgAssignment(input: CreateOrgAssignmentInput): Promise<CandidateOrgAssignment> {
    const now = new Date();
    const assignment: CandidateOrgAssignment = {
      id: uuidv4(),
      globalCandidateId: input.globalCandidateId,
      tenantId: input.tenantId,
      localCandidateId: input.localCandidateId,
      status: 'active',
      addedBy: input.addedBy,
      addedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    orgAssignmentStore.set(assignment.id, assignment);
    return assignment;
  }

  // ── Cross-Tenant Consent ───────────────────────────────────────────────────

  async findConsentById(id: string): Promise<CrossTenantConsent | undefined> {
    return crossTenantConsentStore.get(id);
  }

  async findCrossOrgConsents(globalCandidateId: string): Promise<CrossTenantConsent[]> {
    const results: CrossTenantConsent[] = [];
    for (const c of crossTenantConsentStore.values()) {
      if (c.globalCandidateId === globalCandidateId) results.push(c);
    }
    return results;
  }

  async findCrossOrgConsentByPair(
    globalCandidateId: string,
    sourceOrgId: string,
    targetOrgId: string,
    consentType: string
  ): Promise<CrossTenantConsent | undefined> {
    for (const c of crossTenantConsentStore.values()) {
      if (
        c.globalCandidateId === globalCandidateId &&
        c.sourceOrgId === sourceOrgId &&
        c.targetOrgId === targetOrgId &&
        c.consentType === consentType
      ) {
        return c;
      }
    }
    return undefined;
  }

  async createCrossOrgConsent(input: CreateCrossTenantConsentInput): Promise<CrossTenantConsent> {
    const now = new Date();
    const consent: CrossTenantConsent = {
      id: uuidv4(),
      globalCandidateId: input.globalCandidateId,
      sourceOrgId: input.sourceOrgId,
      targetOrgId: input.targetOrgId,
      consentType: input.consentType,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };

    crossTenantConsentStore.set(consent.id, consent);
    return consent;
  }

  async updateCrossOrgConsent(
    id: string,
    data: UpdateCrossTenantConsentInput
  ): Promise<CrossTenantConsent | undefined> {
    const existing = crossTenantConsentStore.get(id);
    if (!existing) return undefined;

    const updated: CrossTenantConsent = {
      ...existing,
      ...(data.status !== undefined && { status: data.status }),
      ...(data.grantedAt !== undefined && { grantedAt: data.grantedAt }),
      ...(data.expiresAt !== undefined && { expiresAt: data.expiresAt }),
      ...(data.revokedAt !== undefined && { revokedAt: data.revokedAt }),
      ...(data.candidateSignature !== undefined && { candidateSignature: data.candidateSignature }),
      updatedAt: new Date(),
    };

    crossTenantConsentStore.set(id, updated);
    return updated;
  }

  // ── Testing helpers ────────────────────────────────────────────────────────

  async clear(): Promise<void> {
    globalCandidateStore.clear();
    orgAssignmentStore.clear();
    crossTenantConsentStore.clear();
    emailIndex.clear();
  }
}

export const globalCandidateRepository = new GlobalCandidateRepository();
