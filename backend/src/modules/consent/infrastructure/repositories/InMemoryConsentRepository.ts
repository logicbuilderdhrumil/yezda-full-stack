import { v4 as uuid } from 'uuid';
import type { IConsentRepository, ConsentSubmitDto, ConsentUpdateDto } from '../../domain/ports/IConsentRepository.js';
import type { Consent, ConsentPrompt } from '../../domain/entities/consent.entity.js';

export class InMemoryConsentRepository implements IConsentRepository {
  private consents: Consent[] = [];

  async getPrompt(applicationId: string): Promise<ConsentPrompt | null> {
    return {
      applicationId,
      title: 'Data Consent',
      description: 'Please review and consent to data usage.',
      scopes: ['profile', 'screening_results'],
      requiredScopes: ['profile'],
    };
  }

  async getAll(tenantId: string, userId: string): Promise<Consent[]> {
    return this.consents.filter((c) => c.tenantId === tenantId && c.userId === userId);
  }

  async getById(tenantId: string, consentId: string): Promise<Consent | null> {
    return this.consents.find((c) => c.id === consentId && c.tenantId === tenantId) ?? null;
  }

  async submit(tenantId: string, userId: string, dto: ConsentSubmitDto): Promise<Consent> {
    const now = new Date();
    const consent: Consent = {
      id: uuid(),
      tenantId,
      userId,
      applicationId: dto.applicationId,
      status: dto.decision === 'grant' ? 'granted' : 'denied',
      scopes: dto.scopes,
      consentedAt: dto.decision === 'grant' ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };
    this.consents.push(consent);
    return consent;
  }

  async update(tenantId: string, consentId: string, dto: ConsentUpdateDto): Promise<Consent | null> {
    const idx = this.consents.findIndex((c) => c.id === consentId && c.tenantId === tenantId);
    if (idx === -1) return null;
    const now = new Date();
    if (dto.scopes) this.consents[idx].scopes = dto.scopes;
    if (dto.status === 'withdrawn') {
      this.consents[idx].status = 'withdrawn';
      this.consents[idx].withdrawnAt = now;
    }
    this.consents[idx].updatedAt = now;
    return this.consents[idx];
  }
}
