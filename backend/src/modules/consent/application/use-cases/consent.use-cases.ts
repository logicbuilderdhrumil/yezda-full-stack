import type { IConsentRepository, Consent, ConsentPrompt, ConsentSubmitDto, ConsentUpdateDto } from '../../domain/index.js';

export class GetConsentPrompt {
  constructor(private repo: IConsentRepository) {}
  async execute(applicationId: string): Promise<ConsentPrompt | null> { return this.repo.getPrompt(applicationId); }
}

export class GetConsentStatus {
  constructor(private repo: IConsentRepository) {}
  async execute(tenantId: string, userId: string): Promise<Consent[]> { return this.repo.getAll(tenantId, userId); }
}

export class GetConsentById {
  constructor(private repo: IConsentRepository) {}
  async execute(tenantId: string, consentId: string): Promise<Consent | null> { return this.repo.getById(tenantId, consentId); }
}

export class SubmitConsent {
  constructor(private repo: IConsentRepository) {}
  async execute(tenantId: string, userId: string, dto: ConsentSubmitDto): Promise<Consent> { return this.repo.submit(tenantId, userId, dto); }
}

export class UpdateConsent {
  constructor(private repo: IConsentRepository) {}
  async execute(tenantId: string, consentId: string, dto: ConsentUpdateDto): Promise<Consent | null> { return this.repo.update(tenantId, consentId, dto); }
}
