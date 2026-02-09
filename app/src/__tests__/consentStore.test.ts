/**
 * Unit tests for consent store.
 * Task 1.7: Add tests for consent capture, update, and disclosure flows.
 */

import { act } from '@testing-library/react-native';
import { useConsentStore } from '../store/consentStore';
import { ConsentApiError } from '../services/consentService';
import type { ConsentScope, ConsentPromptRequest, ConsentDecision, ConsentSubmitResponse } from '../types/consent.types';

// Mock the consent service
jest.mock('../services/consentService', () => {
  const MockConsentApiError = class extends Error {
    public errorCode: string;
    public statusCode: number;
    constructor(errorCode: string, message: string, statusCode: number) {
      super(message);
      this.name = 'ConsentApiError';
      this.errorCode = errorCode;
      this.statusCode = statusCode;
    }
  };
  return {
    getConsentPrompt: jest.fn(),
    submitConsent: jest.fn(),
    getConsentStatus: jest.fn(),
    updateConsent: jest.fn(),
    withdrawConsent: jest.fn(),
    ConsentApiError: MockConsentApiError,
  };
});

import {
  getConsentPrompt,
  submitConsent,
  getConsentStatus,
  updateConsent,
  withdrawConsent,
} from '../services/consentService';

const mockGetConsentPrompt = getConsentPrompt as jest.MockedFunction<typeof getConsentPrompt>;
const mockSubmitConsent = submitConsent as jest.MockedFunction<typeof submitConsent>;
const mockGetConsentStatus = getConsentStatus as jest.MockedFunction<typeof getConsentStatus>;
const mockUpdateConsent = updateConsent as jest.MockedFunction<typeof updateConsent>;
const mockWithdrawConsent = withdrawConsent as jest.MockedFunction<typeof withdrawConsent>;

describe('useConsentStore', () => {
  beforeEach(() => {
    // Reset store state
    useConsentStore.setState({
      prompt: null,
      selectedScopes: [],
      consents: [],
      prefillDisclosures: [],
      screenState: 'idle',
      error: null,
    });

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('loadConsentPrompt', () => {
    it('loads prompt and pre-selects all scopes', async () => {
      const mockPrompt: ConsentPromptRequest = {
        applicationId: 'app-123',
        sourceApplicationId: 'app-456',
        availableScopes: ['personal_info', 'employment_history'] as ConsentScope[],
        sourceOrganization: 'Acme Corp',
        targetOrganization: 'New Corp',
        sourceDate: '2025-01-15',
        workflowState: 'awaiting_response',
      };

      mockGetConsentPrompt.mockResolvedValueOnce(mockPrompt);

      let result: boolean | undefined;
      await act(async () => {
        result = await useConsentStore.getState().loadConsentPrompt('app-123');
      });

      expect(result).toBe(true);
      expect(useConsentStore.getState().prompt).toEqual(mockPrompt);
      expect(useConsentStore.getState().selectedScopes).toEqual([
        'personal_info',
        'employment_history',
      ]);
      expect(useConsentStore.getState().screenState).toBe('idle');
    });

    it('returns false when no prompt available', async () => {
      mockGetConsentPrompt.mockResolvedValueOnce(null);

      let result: boolean | undefined;
      await act(async () => {
        result = await useConsentStore.getState().loadConsentPrompt('app-123');
      });

      expect(result).toBe(false);
      expect(useConsentStore.getState().prompt).toBeNull();
      expect(useConsentStore.getState().selectedScopes).toEqual([]);
    });

    it('sets error on failure', async () => {
      mockGetConsentPrompt.mockRejectedValueOnce(
        new ConsentApiError('LOAD_FAILED', 'Failed to load', 500)
      );

      await act(async () => {
        await useConsentStore.getState().loadConsentPrompt('app-123');
      });

      expect(useConsentStore.getState().screenState).toBe('error');
      expect(useConsentStore.getState().error).toBe('Failed to load');
    });
  });

  describe('scope selection', () => {
    beforeEach(() => {
      useConsentStore.setState({
        prompt: {
          applicationId: 'app-123',
          sourceApplicationId: 'app-456',
          availableScopes: ['personal_info', 'employment_history', 'addresses'],
          sourceOrganization: 'Acme Corp',
          targetOrganization: 'New Corp',
          sourceDate: '2025-01-15',
          workflowState: 'awaiting_response',
        },
        selectedScopes: ['personal_info', 'employment_history', 'addresses'],
      });
    });

    it('toggleScope removes selected scope', () => {
      act(() => {
        useConsentStore.getState().toggleScope('personal_info');
      });

      expect(useConsentStore.getState().selectedScopes).toEqual([
        'employment_history',
        'addresses',
      ]);
    });

    it('toggleScope adds unselected scope', () => {
      useConsentStore.setState({ selectedScopes: ['personal_info'] });

      act(() => {
        useConsentStore.getState().toggleScope('employment_history');
      });

      expect(useConsentStore.getState().selectedScopes).toEqual([
        'personal_info',
        'employment_history',
      ]);
    });

    it('selectAllScopes selects all available scopes', () => {
      useConsentStore.setState({ selectedScopes: [] });

      act(() => {
        useConsentStore.getState().selectAllScopes();
      });

      expect(useConsentStore.getState().selectedScopes).toEqual([
        'personal_info',
        'employment_history',
        'addresses',
      ]);
    });

    it('clearAllScopes clears selection', () => {
      act(() => {
        useConsentStore.getState().clearAllScopes();
      });

      expect(useConsentStore.getState().selectedScopes).toEqual([]);
    });
  });

  describe('submitConsentDecision', () => {
    beforeEach(() => {
      useConsentStore.setState({
        prompt: {
          applicationId: 'app-123',
          sourceApplicationId: 'app-456',
          availableScopes: ['personal_info', 'employment_history'],
          sourceOrganization: 'Acme Corp',
          targetOrganization: 'New Corp',
          sourceDate: '2025-01-15',
          workflowState: 'awaiting_response',
        },
        selectedScopes: ['personal_info'],
      });
    });

    it('submits acceptance with selected scopes', async () => {
      const mockResponse: ConsentSubmitResponse = {
        consent: {
          id: 'consent-123',
          candidateId: 'candidate-1',
          applicationId: 'app-123',
          sourceApplicationId: 'app-456',
          scopes: ['personal_info'] as ConsentScope[],
          status: 'granted',
          workflowState: 'accepted',
          grantedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        workflowState: 'accepted',
      };

      mockSubmitConsent.mockResolvedValueOnce(mockResponse);

      let result: boolean | undefined;
      await act(async () => {
        result = await useConsentStore.getState().submitConsentDecision(true);
      });

      expect(result).toBe(true);
      expect(mockSubmitConsent).toHaveBeenCalledWith({
        applicationId: 'app-123',
        sourceApplicationId: 'app-456',
        acceptedScopes: ['personal_info'],
        accepted: true,
      });
      expect(useConsentStore.getState().consents).toContainEqual(mockResponse.consent);
      expect(useConsentStore.getState().prompt).toBeNull();
      expect(useConsentStore.getState().screenState).toBe('success');
    });

    it('submits decline with empty scopes', async () => {
      const mockResponse: ConsentSubmitResponse = {
        consent: {
          id: 'consent-123',
          candidateId: 'candidate-1',
          applicationId: 'app-123',
          sourceApplicationId: 'app-456',
          scopes: [] as ConsentScope[],
          status: 'denied',
          workflowState: 'declined',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        workflowState: 'declined',
      };

      mockSubmitConsent.mockResolvedValueOnce(mockResponse);

      await act(async () => {
        await useConsentStore.getState().submitConsentDecision(false);
      });

      expect(mockSubmitConsent).toHaveBeenCalledWith({
        applicationId: 'app-123',
        sourceApplicationId: 'app-456',
        acceptedScopes: [],
        accepted: false,
      });
    });

    it('sets error on submission failure', async () => {
      mockSubmitConsent.mockRejectedValueOnce(
        new ConsentApiError('SUBMIT_FAILED', 'Submission failed', 500)
      );

      let result: boolean | undefined;
      await act(async () => {
        result = await useConsentStore.getState().submitConsentDecision(true);
      });

      expect(result).toBe(false);
      expect(useConsentStore.getState().screenState).toBe('error');
      expect(useConsentStore.getState().error).toBe('Submission failed');
    });
  });

  describe('loadConsentHistory', () => {
    it('loads all consents', async () => {
      const mockConsents: ConsentDecision[] = [
        {
          id: 'consent-1',
          candidateId: 'candidate-1',
          applicationId: 'app-123',
          sourceApplicationId: 'app-456',
          scopes: ['personal_info'] as ConsentScope[],
          status: 'granted',
          workflowState: 'accepted',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'consent-2',
          candidateId: 'candidate-1',
          applicationId: 'app-789',
          sourceApplicationId: 'app-456',
          scopes: [] as ConsentScope[],
          status: 'denied',
          workflowState: 'declined',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      mockGetConsentStatus.mockResolvedValueOnce({ consents: mockConsents });

      await act(async () => {
        await useConsentStore.getState().loadConsentHistory();
      });

      expect(useConsentStore.getState().consents).toEqual(mockConsents);
      expect(useConsentStore.getState().screenState).toBe('idle');
    });
  });

  describe('withdrawConsent', () => {
    beforeEach(() => {
      useConsentStore.setState({
        consents: [
          {
            id: 'consent-123',
            candidateId: 'candidate-1',
            applicationId: 'app-123',
            sourceApplicationId: 'app-456',
            scopes: ['personal_info'],
            status: 'granted',
            workflowState: 'accepted',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      });
    });

    it('withdraws consent and updates state', async () => {
      const updatedConsent: ConsentDecision = {
        id: 'consent-123',
        candidateId: 'candidate-1',
        applicationId: 'app-123',
        sourceApplicationId: 'app-456',
        scopes: ['personal_info'] as ConsentScope[],
        status: 'withdrawn',
        workflowState: 'revoked',
        withdrawnAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockWithdrawConsent.mockResolvedValueOnce(updatedConsent);

      let result: boolean | undefined;
      await act(async () => {
        result = await useConsentStore.getState().withdrawConsent('consent-123');
      });

      expect(result).toBe(true);
      expect(useConsentStore.getState().consents[0].status).toBe('withdrawn');
      expect(useConsentStore.getState().screenState).toBe('success');
    });

    it('sets error on withdrawal failure', async () => {
      mockWithdrawConsent.mockRejectedValueOnce(
        new ConsentApiError('WITHDRAW_FAILED', 'Withdrawal failed', 500)
      );

      let result: boolean | undefined;
      await act(async () => {
        result = await useConsentStore.getState().withdrawConsent('consent-123');
      });

      expect(result).toBe(false);
      expect(useConsentStore.getState().screenState).toBe('error');
      expect(useConsentStore.getState().error).toBe('Withdrawal failed');
    });
  });

  describe('updateConsentScopes', () => {
    beforeEach(() => {
      useConsentStore.setState({
        consents: [
          {
            id: 'consent-123',
            candidateId: 'candidate-1',
            applicationId: 'app-123',
            sourceApplicationId: 'app-456',
            scopes: ['personal_info', 'employment_history'] as ConsentScope[],
            status: 'granted',
            workflowState: 'accepted',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      });
    });

    it('updates scopes for existing consent', async () => {
      const updatedConsent: ConsentDecision = {
        id: 'consent-123',
        candidateId: 'candidate-1',
        applicationId: 'app-123',
        sourceApplicationId: 'app-456',
        scopes: ['personal_info'] as ConsentScope[],
        status: 'granted',
        workflowState: 'accepted',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      mockUpdateConsent.mockResolvedValueOnce(updatedConsent);

      let result: boolean | undefined;
      await act(async () => {
        result = await useConsentStore.getState().updateConsentScopes('consent-123', ['personal_info'] as ConsentScope[]);
      });

      expect(result).toBe(true);
      expect(mockUpdateConsent).toHaveBeenCalledWith('consent-123', {
        scopes: ['personal_info'],
      });
      expect(useConsentStore.getState().consents[0].scopes).toEqual(['personal_info']);
      expect(useConsentStore.getState().screenState).toBe('success');
    });

    it('handles update failure gracefully', async () => {
      mockUpdateConsent.mockRejectedValueOnce(
        new ConsentApiError('UPDATE_FAILED', 'Update failed', 500)
      );

      let result: boolean | undefined;
      await act(async () => {
        result = await useConsentStore.getState().updateConsentScopes('consent-123', ['personal_info'] as ConsentScope[]);
      });

      expect(result).toBe(false);
      expect(useConsentStore.getState().screenState).toBe('error');
      expect(useConsentStore.getState().error).toBe('Update failed');
    });
  });

  describe('prefillDisclosures', () => {
    it('sets prefill disclosures', () => {
      const disclosures = [
        {
          fieldName: 'firstName',
          sourceApplicationId: 'app-456',
          sourceOrganization: 'Acme Corp',
          sourceDate: '2025-01-15',
          value: 'John',
        },
      ];

      act(() => {
        useConsentStore.getState().setPrefillDisclosures(disclosures);
      });

      expect(useConsentStore.getState().prefillDisclosures).toEqual(disclosures);
    });
  });

  describe('clearPrompt', () => {
    it('clears prompt and resets state', () => {
      useConsentStore.setState({
        prompt: {
          applicationId: 'app-123',
          sourceApplicationId: 'app-456',
          availableScopes: ['personal_info'],
          sourceOrganization: 'Acme Corp',
          targetOrganization: 'New Corp',
          sourceDate: '2025-01-15',
          workflowState: 'awaiting_response',
        },
        selectedScopes: ['personal_info'],
        screenState: 'loading',
        error: 'Some error',
      });

      act(() => {
        useConsentStore.getState().clearPrompt();
      });

      expect(useConsentStore.getState().prompt).toBeNull();
      expect(useConsentStore.getState().selectedScopes).toEqual([]);
      expect(useConsentStore.getState().screenState).toBe('idle');
      expect(useConsentStore.getState().error).toBeNull();
    });
  });
});
