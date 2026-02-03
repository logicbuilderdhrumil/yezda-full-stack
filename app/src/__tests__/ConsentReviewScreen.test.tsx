/**
 * Unit tests for ConsentReviewScreen component.
 * Task 1.7: Add tests for consent capture, update, and disclosure flows.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { ConsentReviewScreen } from '../screens/ConsentReviewScreen';
import { useConsentStore } from '../store/consentStore';

// Mock the consent store
jest.mock('../store/consentStore', () => ({
  useConsentStore: jest.fn(),
  selectConsents: jest.fn((state: any) => state?.consents ?? []),
  selectConsentScreenState: jest.fn((state: any) => state?.screenState ?? 'idle'),
  selectConsentError: jest.fn((state: any) => state?.error ?? null),
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

const mockUseConsentStore = useConsentStore as jest.MockedFunction<typeof useConsentStore>;

describe('ConsentReviewScreen', () => {
  const defaultMockState: any = {
    consents: [
      {
        id: 'consent-1',
        candidateId: 'candidate-1',
        applicationId: 'app-123',
        sourceApplicationId: 'app-456',
        scopes: ['personal_info', 'employment_history'],
        status: 'granted',
        grantedAt: Date.now() - 86400000, // 1 day ago
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
    screenState: 'idle',
    error: null,
    prompt: null,
    selectedScopes: [],
    prefillDisclosures: [],
    loadConsentPrompt: jest.fn(),
    toggleScope: jest.fn(),
    selectAllScopes: jest.fn(),
    clearAllScopes: jest.fn(),
    submitConsentDecision: jest.fn(),
    setSelectedScopes: jest.fn(),
    loadConsentHistory: jest.fn().mockResolvedValue(undefined),
    updateConsentScopes: jest.fn(),
    withdrawConsent: jest.fn().mockResolvedValue(true),
    setPrefillDisclosures: jest.fn(),
    clearPrompt: jest.fn(),
    clearError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseConsentStore.mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector(defaultMockState);
      }
      return defaultMockState;
    });
  });

  it('renders consent history sections', async () => {
    const { getByText } = render(<ConsentReviewScreen />);

    await waitFor(() => {
      expect(getByText('Data Reuse Consents')).toBeTruthy();
      expect(getByText('Active Consents')).toBeTruthy();
      expect(getByText('History')).toBeTruthy();
    });
  });

  it('displays active consents with withdraw button', async () => {
    const { getByText, getAllByText } = render(<ConsentReviewScreen />);

    await waitFor(() => {
      expect(getByText('Active')).toBeTruthy();
      expect(getAllByText('Withdraw Consent')[0]).toBeTruthy();
    });
  });

  it('displays scopes for active consent', async () => {
    const { getByText } = render(<ConsentReviewScreen />);

    await waitFor(() => {
      expect(getByText('Personal Information')).toBeTruthy();
      expect(getByText('Employment History')).toBeTruthy();
    });
  });

  it('shows loading state', async () => {
    mockUseConsentStore.mockImplementation((selector: any) => {
      const state: any = {
        ...defaultMockState,
        consents: [],
        screenState: 'loading',
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    const { getByText } = render(<ConsentReviewScreen />);

    expect(getByText('Loading consent history...')).toBeTruthy();
  });

  it('shows error message', async () => {
    mockUseConsentStore.mockImplementation((selector: any) => {
      const state: any = {
        ...defaultMockState,
        screenState: 'error',
        error: 'Failed to load consent history',
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    const { getByText } = render(<ConsentReviewScreen />);

    await waitFor(() => {
      expect(getByText('Failed to load consent history')).toBeTruthy();
    });
  });

  it('opens withdraw confirmation modal', async () => {
    const { getByText, getAllByText } = render(<ConsentReviewScreen />);

    await waitFor(() => {
      expect(getAllByText('Withdraw Consent')[0]).toBeTruthy();
    });

    fireEvent.press(getAllByText('Withdraw Consent')[0]);

    await waitFor(() => {
      // Modal content
      expect(getByText(/If you withdraw consent/)).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
    });
  });

  it('calls withdrawConsent on confirm', async () => {
    const withdrawConsent = jest.fn().mockResolvedValue(true);

    mockUseConsentStore.mockImplementation((selector: any) => {
      const state: any = {
        ...defaultMockState,
        withdrawConsent,
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    const { getAllByText } = render(<ConsentReviewScreen />);

    await waitFor(() => {
      expect(getAllByText('Withdraw Consent')[0]).toBeTruthy();
    });

    // Open modal
    fireEvent.press(getAllByText('Withdraw Consent')[0]);

    await waitFor(() => {
      // Modal has additional "Withdraw Consent" button
      expect(getAllByText('Withdraw Consent').length).toBeGreaterThan(1);
    });

    // Click confirm in modal - the second Withdraw Consent button is in the modal
    const allWithdrawButtons = getAllByText('Withdraw Consent');
    fireEvent.press(allWithdrawButtons[allWithdrawButtons.length - 1]);

    // Give async operation time to complete
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(withdrawConsent).toHaveBeenCalledWith('consent-1');
  });

  it('closes modal on cancel', async () => {
    const { getAllByText, getByText, queryByText } = render(<ConsentReviewScreen />);

    await waitFor(() => {
      expect(getAllByText('Withdraw Consent')[0]).toBeTruthy();
    });

    // Open modal
    fireEvent.press(getAllByText('Withdraw Consent')[0]);

    await waitFor(() => {
      expect(getByText('Cancel')).toBeTruthy();
    });

    // Close modal
    fireEvent.press(getByText('Cancel'));

    await waitFor(() => {
      // Modal content should be hidden
      expect(queryByText(/If you withdraw consent/)).toBeNull();
    });
  });

  it('calls onBack when back button pressed', async () => {
    const onBack = jest.fn();

    const { getByText } = render(<ConsentReviewScreen onBack={onBack} />);

    await waitFor(() => {
      expect(getByText('Back')).toBeTruthy();
    });

    fireEvent.press(getByText('Back'));

    expect(onBack).toHaveBeenCalled();
  });

  it('displays empty state when no consents', async () => {
    mockUseConsentStore.mockImplementation((selector: any) => {
      const state: any = {
        ...defaultMockState,
        consents: [],
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    const { getByText } = render(<ConsentReviewScreen />);

    await waitFor(() => {
      expect(getByText('No active consents')).toBeTruthy();
    });
  });
});
