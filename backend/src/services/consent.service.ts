/**
 * Consent service for managing data reuse consent workflows.
 * Integration alignment: app/backend consent flows.
 */

import type {
  ConsentDecision,
  ConsentPromptDTO,
  ConsentSubmitDTO,
  ConsentSubmitResponseDTO,
  ConsentUpdateDTO,
  ConsentStatusResponseDTO,
  ConsentWorkflowState,
  ConsentScope,
} from '../../shared/@types/consent.types.js';

/** In-memory consent store for development */
const consentStore = new Map<string, ConsentDecision>();
const promptStore = new Map<string, ConsentPromptDTO>();

/** Initialize sample data */
function initSampleData(): void {
  if (promptStore.size === 0) {
    promptStore.set('app-001', {
      applicationId: 'app-001',
      sourceApplicationId: 'prev-app-123',
      availableScopes: ['personal_info', 'employment_history', 'addresses'],
      sourceOrganization: 'Acme Corp',
      targetOrganization: 'TechStart Inc',
      sourceDate: '2025-06-15',
      workflowState: 'awaiting_response',
    });
  }
}

initSampleData();

/**
 * Get consent prompt for an application.
 */
export async function getConsentPrompt(
  applicationId: string,
  candidateId: string
): Promise<ConsentPromptDTO | null> {
  const prompt = promptStore.get(applicationId);
  if (!prompt) {
    return null;
  }
  return { ...prompt };
}

/**
 * Submit consent decision.
 */
export async function submitConsent(
  candidateId: string,
  data: ConsentSubmitDTO
): Promise<ConsentSubmitResponseDTO> {
  const now = Date.now();
  const workflowState: ConsentWorkflowState = data.accepted ? 'accepted' : 'declined';

  const consent: ConsentDecision = {
    id: `consent-${now}`,
    candidateId,
    applicationId: data.applicationId,
    sourceApplicationId: data.sourceApplicationId,
    scopes: data.accepted ? data.acceptedScopes : [],
    status: data.accepted ? 'granted' : 'denied',
    workflowState,
    grantedAt: data.accepted ? now : undefined,
    createdAt: now,
    updatedAt: now,
  };

  consentStore.set(consent.id, consent);

  // Update prompt workflow state
  const prompt = promptStore.get(data.applicationId);
  if (prompt) {
    prompt.workflowState = workflowState;
    promptStore.set(data.applicationId, prompt);
  }

  return { consent, workflowState };
}

/**
 * Get all consents for a candidate.
 */
export async function getConsentStatus(
  candidateId: string
): Promise<ConsentStatusResponseDTO> {
  const consents: ConsentDecision[] = [];
  for (const consent of consentStore.values()) {
    if (consent.candidateId === candidateId) {
      consents.push({ ...consent });
    }
  }
  return { consents };
}

/**
 * Get a single consent by ID.
 */
export async function getConsentById(
  consentId: string,
  candidateId: string
): Promise<ConsentDecision | null> {
  const consent = consentStore.get(consentId);
  if (!consent || consent.candidateId !== candidateId) {
    return null;
  }
  return { ...consent };
}

/**
 * Update consent (modify scopes or withdraw).
 */
export async function updateConsent(
  consentId: string,
  candidateId: string,
  data: ConsentUpdateDTO
): Promise<ConsentDecision | null> {
  const consent = consentStore.get(consentId);
  if (!consent || consent.candidateId !== candidateId) {
    return null;
  }

  const now = Date.now();

  if (data.withdraw) {
    consent.status = 'withdrawn';
    consent.workflowState = 'revoked';
    consent.withdrawnAt = now;
    consent.scopes = [];
  } else if (data.scopes) {
    consent.scopes = data.scopes;
  }

  consent.updatedAt = now;
  consentStore.set(consentId, consent);

  return { ...consent };
}

/**
 * Validate consent scopes against available scopes.
 */
export function validateConsentScopes(
  requestedScopes: ConsentScope[],
  availableScopes: ConsentScope[]
): { valid: boolean; invalidScopes: ConsentScope[] } {
  const invalidScopes = requestedScopes.filter(
    (scope) => !availableScopes.includes(scope)
  );
  return {
    valid: invalidScopes.length === 0,
    invalidScopes,
  };
}
