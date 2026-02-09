import type {
  IGlobalCandidateIdentityRepository,
  GlobalCandidateIdentity,
  CrossOrgConsent,
  DataReuseCheck,
  ConsentRequestDto,
} from '../../domain/index.js';

export class LookupByEmail {
  constructor(private repo: IGlobalCandidateIdentityRepository) {}
  async execute(email: string): Promise<GlobalCandidateIdentity | null> { return this.repo.lookupByEmail(email); }
}

export class GetGlobalIdentity {
  constructor(private repo: IGlobalCandidateIdentityRepository) {}
  async execute(id: string): Promise<GlobalCandidateIdentity | null> { return this.repo.getById(id); }
}

export class GetOrganizations {
  constructor(private repo: IGlobalCandidateIdentityRepository) {}
  async execute(id: string): Promise<string[]> { return this.repo.getOrganizations(id); }
}

export class RequestConsent {
  constructor(private repo: IGlobalCandidateIdentityRepository) {}
  async execute(globalCandidateId: string, dto: ConsentRequestDto): Promise<CrossOrgConsent> {
    return this.repo.requestConsent(globalCandidateId, dto);
  }
}

export class GrantConsent {
  constructor(private repo: IGlobalCandidateIdentityRepository) {}
  async execute(consentId: string): Promise<CrossOrgConsent | null> { return this.repo.grantConsent(consentId); }
}

export class DenyConsent {
  constructor(private repo: IGlobalCandidateIdentityRepository) {}
  async execute(consentId: string): Promise<CrossOrgConsent | null> { return this.repo.denyConsent(consentId); }
}

export class RevokeConsent {
  constructor(private repo: IGlobalCandidateIdentityRepository) {}
  async execute(consentId: string): Promise<CrossOrgConsent | null> { return this.repo.revokeConsent(consentId); }
}

export class CheckDataReuse {
  constructor(private repo: IGlobalCandidateIdentityRepository) {}
  async execute(globalCandidateId: string, sourceOrgId: string): Promise<DataReuseCheck> {
    return this.repo.checkDataReuse(globalCandidateId, sourceOrgId);
  }
}
