/**
 * Global Candidate Identity domain entity.
 */
export type CrossOrgConsentStatus = 'pending' | 'granted' | 'denied' | 'revoked';

export interface GlobalCandidateIdentity {
  id: string;
  email: string;
  displayName: string;
  organizations: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CrossOrgConsent {
  id: string;
  globalCandidateId: string;
  sourceOrgId: string;
  targetOrgId: string;
  status: CrossOrgConsentStatus;
  scopes: string[];
  requestedAt: Date;
  decidedAt?: Date;
}

export interface DataReuseCheck {
  allowed: boolean;
  consent?: CrossOrgConsent;
  reason?: string;
}
