/**
 * App Consent Domain Entities
 * Consent capture domain types
 */

export interface ConsentRecord {
  id: string;
  candidateId: string;
  tenantId: string;
  consentType: string;
  status: 'granted' | 'withdrawn';
  grantedAt?: Date;
  withdrawnAt?: Date;
  reason?: string;
}

export interface ConsentCaptureInput {
  consentType: string;
  version?: string;
  dataCategories?: string[];
  processingPurposes?: string[];
}

export interface ConsentWithdrawalInput {
  reason?: string;
}

export interface DataReuseCheckInput {
  candidateId: string;
  dataCategory?: string;
}

export interface DataReuseResponse {
  allowed: boolean;
  reason?: string;
}

export interface ConsentResult {
  success: boolean;
  consent?: ConsentRecord;
  response?: DataReuseResponse;
  error?: string;
  errorCode?: string;
}
