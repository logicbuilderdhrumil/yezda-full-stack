import { v4 as uuid } from 'uuid';
import type { IGlobalCandidateIdentityRepository, ConsentRequestDto } from '../../domain/ports/IGlobalCandidateIdentityRepository.js';
import type { GlobalCandidateIdentity, CrossOrgConsent, DataReuseCheck } from '../../domain/entities/global-candidate-identity.entity.js';

export class InMemoryGlobalCandidateIdentityRepository implements IGlobalCandidateIdentityRepository {
  private identities: GlobalCandidateIdentity[] = [];
  private consents: CrossOrgConsent[] = [];

  async lookupByEmail(email: string): Promise<GlobalCandidateIdentity | null> {
    return this.identities.find((i) => i.email === email) ?? null;
  }

  async getById(id: string): Promise<GlobalCandidateIdentity | null> {
    return this.identities.find((i) => i.id === id) ?? null;
  }

  async getOrganizations(id: string): Promise<string[]> {
    const identity = this.identities.find((i) => i.id === id);
    return identity?.organizations ?? [];
  }

  async requestConsent(globalCandidateId: string, dto: ConsentRequestDto): Promise<CrossOrgConsent> {
    const consent: CrossOrgConsent = {
      id: uuid(),
      globalCandidateId,
      sourceOrgId: dto.sourceOrgId,
      targetOrgId: dto.targetOrgId,
      status: 'pending',
      scopes: dto.scopes,
      requestedAt: new Date(),
    };
    this.consents.push(consent);
    return consent;
  }

  async grantConsent(consentId: string): Promise<CrossOrgConsent | null> {
    const idx = this.consents.findIndex((c) => c.id === consentId);
    if (idx === -1) return null;
    this.consents[idx] = { ...this.consents[idx], status: 'granted', decidedAt: new Date() };
    return this.consents[idx];
  }

  async denyConsent(consentId: string): Promise<CrossOrgConsent | null> {
    const idx = this.consents.findIndex((c) => c.id === consentId);
    if (idx === -1) return null;
    this.consents[idx] = { ...this.consents[idx], status: 'denied', decidedAt: new Date() };
    return this.consents[idx];
  }

  async revokeConsent(consentId: string): Promise<CrossOrgConsent | null> {
    const idx = this.consents.findIndex((c) => c.id === consentId);
    if (idx === -1) return null;
    this.consents[idx] = { ...this.consents[idx], status: 'revoked', decidedAt: new Date() };
    return this.consents[idx];
  }

  async checkDataReuse(globalCandidateId: string, sourceOrgId: string): Promise<DataReuseCheck> {
    const consent = this.consents.find(
      (c) => c.globalCandidateId === globalCandidateId && c.sourceOrgId === sourceOrgId && c.status === 'granted',
    );
    return consent
      ? { allowed: true, consent }
      : { allowed: false, reason: 'No active consent' };
  }
}
