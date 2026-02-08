/**
 * Consent state store using Zustand.
 * Task 1.2: Implement consent prompt and decision capture.
 * Task 1.4: Add consent review and update screen.
 */

import { create } from 'zustand';
import {
  ConsentDecision,
  ConsentPromptRequest,
  ConsentScope,
  ConsentScreenState,
  PrefillDisclosure,
} from '../types/consent.types';
import {
  getConsentPrompt as apiGetConsentPrompt,
  submitConsent as apiSubmitConsent,
  getConsentStatus as apiGetConsentStatus,
  updateConsent as apiUpdateConsent,
  withdrawConsent as apiWithdrawConsent,
  ConsentApiError,
} from '../services/consentService';

interface ConsentState {
  // Current prompt for new consent
  prompt: ConsentPromptRequest | null;
  // Selected scopes for current prompt
  selectedScopes: ConsentScope[];
  // All consent decisions for the user
  consents: ConsentDecision[];
  // Prefill disclosures for current form
  prefillDisclosures: PrefillDisclosure[];
  // UI state
  screenState: ConsentScreenState;
  error: string | null;

  // Actions
  loadConsentPrompt: (applicationId: string) => Promise<boolean>;
  setSelectedScopes: (scopes: ConsentScope[]) => void;
  toggleScope: (scope: ConsentScope) => void;
  selectAllScopes: () => void;
  clearAllScopes: () => void;
  submitConsentDecision: (accepted: boolean) => Promise<boolean>;
  loadConsentHistory: () => Promise<void>;
  updateConsentScopes: (consentId: string, scopes: ConsentScope[]) => Promise<boolean>;
  withdrawConsent: (consentId: string) => Promise<boolean>;
  setPrefillDisclosures: (disclosures: PrefillDisclosure[]) => void;
  clearPrompt: () => void;
  clearError: () => void;
}

export const useConsentStore = create<ConsentState>((set, get) => ({
  // Initial state
  prompt: null,
  selectedScopes: [],
  consents: [],
  prefillDisclosures: [],
  screenState: 'idle',
  error: null,

  /**
   * Load consent prompt for an application.
   * Returns true if a prompt is available.
   */
  loadConsentPrompt: async (applicationId: string) => {
    set({ screenState: 'loading', error: null });

    try {
      const prompt = await apiGetConsentPrompt(applicationId);

      if (!prompt) {
        set({ prompt: null, selectedScopes: [], screenState: 'idle' });
        return false;
      }

      // Pre-select all available scopes by default
      set({
        prompt,
        selectedScopes: [...prompt.availableScopes],
        screenState: 'idle',
      });
      return true;
    } catch (error) {
      const message =
        error instanceof ConsentApiError
          ? error.message
          : 'Failed to load consent options';
      set({ screenState: 'error', error: message });
      return false;
    }
  },

  /**
   * Set selected scopes directly.
   */
  setSelectedScopes: (scopes: ConsentScope[]) => {
    set({ selectedScopes: scopes });
  },

  /**
   * Toggle a single scope on/off.
   */
  toggleScope: (scope: ConsentScope) => {
    const { selectedScopes } = get();
    const isSelected = selectedScopes.includes(scope);
    set({
      selectedScopes: isSelected
        ? selectedScopes.filter((s) => s !== scope)
        : [...selectedScopes, scope],
    });
  },

  /**
   * Select all available scopes.
   */
  selectAllScopes: () => {
    const { prompt } = get();
    if (prompt) {
      set({ selectedScopes: [...prompt.availableScopes] });
    }
  },

  /**
   * Clear all selected scopes.
   */
  clearAllScopes: () => {
    set({ selectedScopes: [] });
  },

  /**
   * Submit consent decision.
   */
  submitConsentDecision: async (accepted: boolean) => {
    const { prompt, selectedScopes } = get();

    if (!prompt) {
      set({ error: 'No consent prompt available' });
      return false;
    }

    set({ screenState: 'loading', error: null });

    try {
      const response = await apiSubmitConsent({
        applicationId: prompt.applicationId,
        sourceApplicationId: prompt.sourceApplicationId,
        acceptedScopes: accepted ? selectedScopes : [],
        accepted,
      });

      set((state) => ({
        consents: [...state.consents, response.consent],
        prompt: null,
        selectedScopes: [],
        screenState: 'success',
      }));

      return true;
    } catch (error) {
      const message =
        error instanceof ConsentApiError
          ? error.message
          : 'Failed to save consent decision';
      set({ screenState: 'error', error: message });
      return false;
    }
  },

  /**
   * Load all consent decisions for history/review.
   */
  loadConsentHistory: async () => {
    set({ screenState: 'loading', error: null });

    try {
      const response = await apiGetConsentStatus();
      set({ consents: response.consents ?? [], screenState: 'idle' });
    } catch (error) {
      const message =
        error instanceof ConsentApiError
          ? error.message
          : 'Failed to load consent history';
      set({ screenState: 'error', error: message });
    }
  },

  /**
   * Update scopes for an existing consent.
   */
  updateConsentScopes: async (consentId: string, scopes: ConsentScope[]) => {
    set({ screenState: 'loading', error: null });

    try {
      const updated = await apiUpdateConsent(consentId, { scopes });

      set((state) => ({
        consents: state.consents.map((c) =>
          c.id === consentId ? updated : c
        ),
        screenState: 'success',
      }));

      return true;
    } catch (error) {
      const message =
        error instanceof ConsentApiError
          ? error.message
          : 'Failed to update consent';
      set({ screenState: 'error', error: message });
      return false;
    }
  },

  /**
   * Withdraw consent entirely.
   */
  withdrawConsent: async (consentId: string) => {
    set({ screenState: 'loading', error: null });

    try {
      const updated = await apiWithdrawConsent(consentId);

      set((state) => ({
        consents: state.consents.map((c) =>
          c.id === consentId ? updated : c
        ),
        screenState: 'success',
      }));

      return true;
    } catch (error) {
      const message =
        error instanceof ConsentApiError
          ? error.message
          : 'Failed to withdraw consent';
      set({ screenState: 'error', error: message });
      return false;
    }
  },

  /**
   * Set prefill disclosures for the current form.
   */
  setPrefillDisclosures: (disclosures: PrefillDisclosure[]) => {
    set({ prefillDisclosures: disclosures });
  },

  /**
   * Clear the current prompt.
   */
  clearPrompt: () => {
    set({ prompt: null, selectedScopes: [], screenState: 'idle', error: null });
  },

  /**
   * Clear any displayed error.
   */
  clearError: () => {
    set({ error: null });
  },
}));

/**
 * Selector hooks for common consent state.
 */
export const selectPrompt = (state: ConsentState) => state.prompt;
export const selectSelectedScopes = (state: ConsentState) => state.selectedScopes;
export const selectConsents = (state: ConsentState) => state.consents;
export const selectPrefillDisclosures = (state: ConsentState) => state.prefillDisclosures;
export const selectConsentScreenState = (state: ConsentState) => state.screenState;
export const selectConsentError = (state: ConsentState) => state.error;

/**
 * Get active consents (granted, not withdrawn).
 */
export const selectActiveConsents = (state: ConsentState) =>
  state.consents.filter((c) => c.status === 'granted');

/**
 * Check if a specific consent has a scope granted.
 */
export const selectHasConsentForScope = (consentId: string, scope: ConsentScope) => (state: ConsentState) => {
  const consent = state.consents.find((c) => c.id === consentId);
  return consent?.status === 'granted' && consent.scopes.includes(scope);
};
