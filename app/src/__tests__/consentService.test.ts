/**
 * Unit tests for consent service.
 * Task 1.7: Add tests for consent capture, update, and disclosure flows.
 */

import { ConsentApiError } from '../services/consentService';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock secure storage
jest.mock('../utils/secureStorage', () => ({
  getStoredTokens: jest.fn().mockResolvedValue({
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresAt: Date.now() + 3600000,
  }),
}));

// Import after mocking
import {
  getConsentPrompt,
  submitConsent,
  getConsentStatus,
  updateConsent,
  withdrawConsent,
} from '../services/consentService';

describe('ConsentApiError', () => {
  it('creates error with code, message, and status', () => {
    const error = new ConsentApiError('SUBMIT_FAILED', 'Failed to submit', 400);

    expect(error.code).toBe('SUBMIT_FAILED');
    expect(error.message).toBe('Failed to submit');
    expect(error.status).toBe(400);
    expect(error.name).toBe('ConsentApiError');
  });
});

describe('getConsentPrompt', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns consent prompt when available', async () => {
    const mockResponse = {
      applicationId: 'app-123',
      sourceApplicationId: 'app-456',
      availableScopes: ['personal_info', 'employment_history'],
      sourceOrganization: 'Acme Corp',
      targetOrganization: 'New Corp',
      sourceDate: '2025-01-15',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await getConsentPrompt('app-123');

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/consent/prompt/app-123'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-access-token',
        }),
      })
    );
  });

  it('returns null when no reusable data available', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ code: 'NOT_FOUND', message: 'No data found' }),
    });

    const result = await getConsentPrompt('app-789');

    expect(result).toBeNull();
  });

  it('throws ConsentApiError for server errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ code: 'SERVER_ERROR', message: 'Internal error' }),
    });

    await expect(getConsentPrompt('app-123')).rejects.toThrow(ConsentApiError);
  });
});

describe('submitConsent', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('submits consent acceptance successfully', async () => {
    const mockResponse = {
      consent: {
        id: 'consent-123',
        candidateId: 'candidate-1',
        applicationId: 'app-123',
        sourceApplicationId: 'app-456',
        scopes: ['personal_info', 'employment_history'],
        status: 'granted',
        grantedAt: Date.now(),
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await submitConsent({
      applicationId: 'app-123',
      sourceApplicationId: 'app-456',
      acceptedScopes: ['personal_info', 'employment_history'],
      accepted: true,
    });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/consent'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          applicationId: 'app-123',
          sourceApplicationId: 'app-456',
          acceptedScopes: ['personal_info', 'employment_history'],
          accepted: true,
        }),
      })
    );
  });

  it('submits consent decline successfully', async () => {
    const mockResponse = {
      consent: {
        id: 'consent-123',
        candidateId: 'candidate-1',
        applicationId: 'app-123',
        sourceApplicationId: 'app-456',
        scopes: [],
        status: 'denied',
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await submitConsent({
      applicationId: 'app-123',
      sourceApplicationId: 'app-456',
      acceptedScopes: [],
      accepted: false,
    });

    expect(result.consent.status).toBe('denied');
  });

  it('throws ConsentApiError on submission failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ code: 'INVALID_REQUEST', message: 'Bad request' }),
    });

    await expect(
      submitConsent({
        applicationId: 'app-123',
        sourceApplicationId: 'app-456',
        acceptedScopes: ['personal_info'],
        accepted: true,
      })
    ).rejects.toMatchObject({
      code: 'INVALID_REQUEST',
    });
  });
});

describe('getConsentStatus', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns all consents for user', async () => {
    const mockResponse = {
      consents: [
        {
          id: 'consent-1',
          candidateId: 'candidate-1',
          applicationId: 'app-123',
          sourceApplicationId: 'app-456',
          scopes: ['personal_info'],
          status: 'granted',
        },
        {
          id: 'consent-2',
          candidateId: 'candidate-1',
          applicationId: 'app-789',
          sourceApplicationId: 'app-456',
          scopes: [],
          status: 'denied',
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await getConsentStatus();

    expect(result.consents).toHaveLength(2);
    expect(result.consents[0].status).toBe('granted');
    expect(result.consents[1].status).toBe('denied');
  });
});

describe('getConsentById', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns single consent by ID', async () => {
    const mockConsent = {
      id: 'consent-123',
      candidateId: 'candidate-1',
      applicationId: 'app-123',
      sourceApplicationId: 'app-456',
      scopes: ['personal_info', 'employment_history'],
      status: 'granted',
      grantedAt: Date.now(),
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockConsent),
    });

    const { getConsentById } = await import('../services/consentService');
    const result = await getConsentById('consent-123');

    expect(result.id).toBe('consent-123');
    expect(result.scopes).toEqual(['personal_info', 'employment_history']);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/consent/consent-123'),
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('throws ConsentApiError when consent not found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ code: 'NOT_FOUND', message: 'Consent not found' }),
    });

    const { getConsentById } = await import('../services/consentService');

    await expect(getConsentById('invalid-id')).rejects.toThrow(ConsentApiError);
  });
});

describe('updateConsent', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('updates consent scopes successfully', async () => {
    const mockResponse = {
      id: 'consent-123',
      candidateId: 'candidate-1',
      applicationId: 'app-123',
      sourceApplicationId: 'app-456',
      scopes: ['personal_info'],
      status: 'granted',
      workflowState: 'accepted',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await updateConsent('consent-123', {
      scopes: ['personal_info'],
    });

    expect(result.scopes).toEqual(['personal_info']);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/consent/consent-123'),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          scopes: ['personal_info'],
          withdraw: undefined,
        }),
      })
    );
  });
});

describe('withdrawConsent', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('withdraws consent successfully', async () => {
    const mockResponse = {
      id: 'consent-123',
      candidateId: 'candidate-1',
      applicationId: 'app-123',
      sourceApplicationId: 'app-456',
      scopes: ['personal_info'],
      status: 'withdrawn',
      withdrawnAt: Date.now(),
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await withdrawConsent('consent-123');

    expect(result.status).toBe('withdrawn');
    expect(result.withdrawnAt).toBeDefined();
  });

  it('throws ConsentApiError on withdrawal failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ code: 'CANNOT_WITHDRAW', message: 'Cannot withdraw' }),
    });

    await expect(withdrawConsent('consent-123')).rejects.toMatchObject({
      code: 'CANNOT_WITHDRAW',
    });
  });
});
