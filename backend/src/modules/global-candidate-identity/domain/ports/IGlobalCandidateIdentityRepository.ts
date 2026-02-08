import type { GlobalCandidateIdentity, CrossOrgConsent, DataReuseCheck } from '../entities/global-candidate-identity.entity.js';

export interface ConsentRequestDto {
  sourceOrgId: string;
  targetOrgId: string;
  scopes: string[];
}

export interface IGlobalCandidateIdentityRepository {
  lookupByEmail(email: string): Promise<GlobalCandidateIdentity | null>;
  getById(id: string): Promise<GlobalCandidateIdentity | null>;
  getOrganizations(id: string): Promise<string[]>;
  requestConsent(globalCandidateId: string, dto: ConsentRequestDto): Promise<CrossOrgConsent>;
  grantConsent(consentId: string): Promise<CrossOrgConsent | null>;
  denyConsent(consentId: string): Promise<CrossOrgConsent | null>;
  revokeConsent(consentId: string): Promise<CrossOrgConsent | null>;
  checkDataReuse(globalCandidateId: string, sourceOrgId: string): Promise<DataReuseCheck>;
}
