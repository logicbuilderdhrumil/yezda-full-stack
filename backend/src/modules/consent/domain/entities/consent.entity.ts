/**
 * Consent domain entity.
 */
export type ConsentStatus = 'pending' | 'granted' | 'denied' | 'withdrawn';

export interface Consent {
  id: string;
  tenantId: string;
  userId: string;
  applicationId: string;
  status: ConsentStatus;
  scopes: string[];
  consentedAt?: Date;
  withdrawnAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentPrompt {
  applicationId: string;
  title: string;
  description: string;
  scopes: string[];
  requiredScopes: string[];
}
