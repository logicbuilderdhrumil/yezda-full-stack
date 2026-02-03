/**
 * Unit tests for ConsentPromptScreen component.
 * Task 1.7: Add tests for consent capture, update, and disclosure flows.
 */

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { ConsentPromptScreen } from '../screens/ConsentPromptScreen';
import { useConsentStore } from '../store/consentStore';

// Mock the consent store
jest.mock('../store/consentStore', () => ({
  useConsentStore: jest.fn(),
  selectPrompt: jest.fn((state: any) => state?.prompt ?? null),
  selectSelectedScopes: jest.fn((state: any) => state?.selectedScopes ?? []),
  selectConsentScreenState: jest.fn((state: any) => state?.screenState ?? 'idle'),
  selectConsentError: jest.fn((state: any) => state?.error ?? null),
}));

const mockUseConsentStore = useConsentStore as jest.MockedFunction<typeof useConsentStore>;

describe('ConsentPromptScreen', () => {
  const defaultMockState: any = {
    prompt: {
      applicationId: 'app-123',
      sourceApplicationId: 'app-456',
      availableScopes: ['personal_info', 'employment_history'],
      sourceOrganization: 'Acme Corp',
      targetOrganization: 'New Corp',
      sourceDate: '2025-01-15',
    },
    selectedScopes: ['personal_info', 'employment_history'],
    screenState: 'idle',
    error: null,
    consents: [],
    prefillDisclosures: [],
    loadConsentPrompt: jest.fn().mockResolvedValue(true),
    toggleScope: jest.fn(),
    selectAllScopes: jest.fn(),
    clearAllScopes: jest.fn(),
    submitConsentDecision: jest.fn().mockResolvedValue(true),
    clearError: jest.fn(),
    setSelectedScopes: jest.fn(),
    loadConsentHistory: jest.fn(),
    updateConsentScopes: jest.fn(),
    withdrawConsent: jest.fn(),
    setPrefillDisclosures: jest.fn(),
    clearPrompt: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    mockUseConsentStore.mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector(defaultMockState);
      }
      return defaultMockState;
    });
  });

  it('renders consent prompt with available scopes', async () => {
    const { getByText } = render(
      <ConsentPromptScreen
        applicationId="app-123"
        onComplete={jest.fn()}
        onSkip={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getByText('Reuse Previous Application Data')).toBeTruthy();
    });

    expect(getByText('Personal Information')).toBeTruthy();
    expect(getByText('Employment History')).toBeTruthy();
    expect(getByText('Accept & Reuse Data')).toBeTruthy();
    expect(getByText("No Thanks, Start Fresh")).toBeTruthy();
  });

  it('displays source organization info', async () => {
    const { getByText } = render(
      <ConsentPromptScreen
        applicationId="app-123"
        onComplete={jest.fn()}
        onSkip={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getByText(/Acme Corp/)).toBeTruthy();
    });
  });

  it('calls onSkip when no prompt available', async () => {
    const onSkip = jest.fn();

    mockUseConsentStore.mockImplementation((selector: any) => {
      const state: any = {
        ...defaultMockState,
        prompt: null,
        loadConsentPrompt: jest.fn().mockResolvedValue(false),
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    render(
      <ConsentPromptScreen
        applicationId="app-123"
        onComplete={jest.fn()}
        onSkip={onSkip}
      />
    );

    await waitFor(() => {
      expect(onSkip).toHaveBeenCalled();
    });
  });

  it('shows loading state', async () => {
    mockUseConsentStore.mockImplementation((selector: any) => {
      const state: any = {
        ...defaultMockState,
        prompt: null,
        screenState: 'loading',
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    const { getByText } = render(
      <ConsentPromptScreen
        applicationId="app-123"
        onComplete={jest.fn()}
        onSkip={jest.fn()}
      />
    );

    expect(getByText('Loading...')).toBeTruthy();
  });

  it('displays error message', async () => {
    mockUseConsentStore.mockImplementation((selector: any) => {
      const state: any = {
        ...defaultMockState,
        screenState: 'error',
        error: 'Failed to load consent options',
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    const { getByText } = render(
      <ConsentPromptScreen
        applicationId="app-123"
        onComplete={jest.fn()}
        onSkip={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getByText('Failed to load consent options')).toBeTruthy();
    });
  });

  it('calls submitConsentDecision(true) on accept', async () => {
    const onComplete = jest.fn();
    const submitConsentDecision = jest.fn().mockResolvedValue(true);

    mockUseConsentStore.mockImplementation((selector: any) => {
      const state: any = {
        ...defaultMockState,
        submitConsentDecision,
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    const { getByText } = render(
      <ConsentPromptScreen
        applicationId="app-123"
        onComplete={onComplete}
        onSkip={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getByText('Accept & Reuse Data')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText('Accept & Reuse Data'));
    });

    expect(submitConsentDecision).toHaveBeenCalledWith(true);
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(true);
    });
  });

  it('calls submitConsentDecision(false) on decline', async () => {
    const onComplete = jest.fn();
    const submitConsentDecision = jest.fn().mockResolvedValue(true);

    mockUseConsentStore.mockImplementation((selector: any) => {
      const state: any = {
        ...defaultMockState,
        submitConsentDecision,
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    const { getByText } = render(
      <ConsentPromptScreen
        applicationId="app-123"
        onComplete={onComplete}
        onSkip={jest.fn()}
      />
    );

    await waitFor(() => {
      expect(getByText("No Thanks, Start Fresh")).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByText("No Thanks, Start Fresh"));
    });

    expect(submitConsentDecision).toHaveBeenCalledWith(false);
    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(false);
    });
  });

  it('disables accept button when no scopes selected', async () => {
    mockUseConsentStore.mockImplementation((selector: any) => {
      const state: any = {
        ...defaultMockState,
        selectedScopes: [],
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    const { getByRole } = render(
      <ConsentPromptScreen
        applicationId="app-123"
        onComplete={jest.fn()}
        onSkip={jest.fn()}
      />
    );

    await waitFor(() => {
      const acceptButton = getByRole('button', { name: 'Accept & Reuse Data' });
      expect(acceptButton.props.accessibilityState.disabled).toBe(true);
    });
  });

  it('shows select/deselect all toggle', async () => {
    const selectAllScopes = jest.fn();
    const clearAllScopes = jest.fn();

    mockUseConsentStore.mockImplementation((selector: any) => {
      const state: any = {
        ...defaultMockState,
        selectAllScopes,
        clearAllScopes,
      };
      if (typeof selector === 'function') {
        return selector(state);
      }
      return state;
    });

    const { getByText } = render(
      <ConsentPromptScreen
        applicationId="app-123"
        onComplete={jest.fn()}
        onSkip={jest.fn()}
      />
    );

    await waitFor(() => {
      // When all are selected, it should say "Deselect All"
      expect(getByText('Deselect All')).toBeTruthy();
    });

    fireEvent.press(getByText('Deselect All'));
    expect(clearAllScopes).toHaveBeenCalled();
  });
});
