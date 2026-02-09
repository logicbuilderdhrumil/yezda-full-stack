import type { Consent, ConsentPrompt } from '../entities/consent.entity.js';

export interface ConsentSubmitDto {
  applicationId: string;
  scopes: string[];
  decision: 'grant' | 'deny';
}

export interface ConsentUpdateDto {
  scopes?: string[];
  status?: 'withdrawn';
}

export interface IConsentRepository {
  getPrompt(applicationId: string): Promise<ConsentPrompt | null>;
  getAll(tenantId: string, userId: string): Promise<Consent[]>;
  getById(tenantId: string, consentId: string): Promise<Consent | null>;
  submit(tenantId: string, userId: string, dto: ConsentSubmitDto): Promise<Consent>;
  update(tenantId: string, consentId: string, dto: ConsentUpdateDto): Promise<Consent | null>;
}
