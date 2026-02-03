/**
 * Application state store using Zustand.
 * Task 1.1: Application list loading states.
 * Task 1.5: Draft save and resume behavior.
 * Task 1.6: Submission flow and confirmation.
 */

import { create } from 'zustand';
import {
  ApplicationSummary,
  Application,
  ApplicationScreenState,
  FormValues,
  FormErrors,
  applicationErrorMessages,
} from '../types/application.types';
import {
  getApplications as apiGetApplications,
  getApplication as apiGetApplication,
  getApplicationDraft as apiGetDraft,
  saveApplicationDraft as apiSaveDraft,
  submitApplication as apiSubmitApplication,
  ApplicationApiError,
} from '../services/applicationService';
import { useAuthStore } from './authStore';

interface ApplicationState {
  // List state
  applications: ApplicationSummary[];
  listScreenState: ApplicationScreenState;
  listError: string | null;

  // Detail state
  currentApplication: Application | null;
  detailScreenState: ApplicationScreenState;
  detailError: string | null;

  // Form state
  formValues: FormValues;
  formErrors: FormErrors;
  isDirty: boolean;
  lastSavedAt: number | null;

  // Submission state
  successMessage: string | null;
  submittedAt: string | null;

  // Actions
  loadApplications: () => Promise<void>;
  loadApplication: (applicationId: string) => Promise<void>;
  setFieldValue: (fieldId: string, value: string | string[] | boolean) => void;
  setFieldErrors: (errors: FormErrors) => void;
  clearFieldError: (fieldId: string) => void;
  saveDraft: () => Promise<boolean>;
  submitApplication: () => Promise<boolean>;
  clearError: () => void;
  clearSuccess: () => void;
  reset: () => void;
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  // Initial state
  applications: [],
  listScreenState: 'idle',
  listError: null,

  currentApplication: null,
  detailScreenState: 'idle',
  detailError: null,

  formValues: {},
  formErrors: {},
  isDirty: false,
  lastSavedAt: null,

  successMessage: null,
  submittedAt: null,

  /**
   * Load the list of assigned applications.
   */
  loadApplications: async () => {
    const tokens = useAuthStore.getState().tokens;
    if (!tokens?.accessToken) {
      set({ listError: 'Not authenticated', listScreenState: 'error' });
      return;
    }

    set({ listScreenState: 'loading', listError: null });

    try {
      const response = await apiGetApplications(tokens.accessToken);
      set({
        applications: response.applications,
        listScreenState: 'idle',
      });
    } catch (error) {
      const message = error instanceof ApplicationApiError
        ? error.message
        : applicationErrorMessages.loadFailed;

      set({
        listScreenState: 'error',
        listError: message,
      });
    }
  },

  /**
   * Load a single application with form details and restore draft.
   */
  loadApplication: async (applicationId: string) => {
    const tokens = useAuthStore.getState().tokens;
    if (!tokens?.accessToken) {
      set({ detailError: 'Not authenticated', detailScreenState: 'error' });
      return;
    }

    set({
      detailScreenState: 'loading',
      detailError: null,
      formValues: {},
      formErrors: {},
      isDirty: false,
      lastSavedAt: null,
      successMessage: null,
      submittedAt: null,
    });

    try {
      // Load application and draft in parallel
      const [appResponse, draftResponse] = await Promise.all([
        apiGetApplication(tokens.accessToken, applicationId),
        apiGetDraft(tokens.accessToken, applicationId),
      ]);

      const application = appResponse.application;

      // Start with empty values
      let restoredValues: FormValues = {};
      let savedAt: number | null = null;

      // Restore draft values if available
      if (draftResponse.draft) {
        restoredValues = draftResponse.draft.values;
        savedAt = draftResponse.draft.savedAt;
      }

      set({
        currentApplication: application,
        formValues: restoredValues,
        lastSavedAt: savedAt,
        detailScreenState: application.status === 'submitted' ? 'submitted' : 'idle',
      });
    } catch (error) {
      const message = error instanceof ApplicationApiError
        ? error.message
        : applicationErrorMessages.loadDetailFailed;

      set({
        detailScreenState: 'error',
        detailError: message,
      });
    }
  },

  /**
   * Update a single field value.
   */
  setFieldValue: (fieldId: string, value: string | string[] | boolean) => {
    set((state) => ({
      formValues: { ...state.formValues, [fieldId]: value },
      isDirty: true,
    }));
  },

  /**
   * Set multiple field errors.
   */
  setFieldErrors: (errors: FormErrors) => {
    set({ formErrors: errors });
  },

  /**
   * Clear a single field error.
   */
  clearFieldError: (fieldId: string) => {
    set((state) => {
      const newErrors = { ...state.formErrors };
      delete newErrors[fieldId];
      return { formErrors: newErrors };
    });
  },

  /**
   * Save current form values as draft.
   */
  saveDraft: async () => {
    const { currentApplication, formValues } = get();
    const tokens = useAuthStore.getState().tokens;

    if (!tokens?.accessToken || !currentApplication) {
      set({ detailError: 'Unable to save draft', detailScreenState: 'error' });
      return false;
    }

    set({ detailScreenState: 'saving', detailError: null });

    try {
      const response = await apiSaveDraft(tokens.accessToken, currentApplication.id, {
        values: formValues,
      });

      set({
        detailScreenState: 'idle',
        lastSavedAt: response.savedAt,
        isDirty: false,
        successMessage: 'Draft saved',
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        const current = get();
        if (current.successMessage === 'Draft saved') {
          set({ successMessage: null });
        }
      }, 3000);

      return true;
    } catch (error) {
      const message = error instanceof ApplicationApiError
        ? error.message
        : applicationErrorMessages.saveFailed;

      set({
        detailScreenState: 'error',
        detailError: message,
      });
      return false;
    }
  },

  /**
   * Submit the application.
   */
  submitApplication: async () => {
    const { currentApplication, formValues } = get();
    const tokens = useAuthStore.getState().tokens;

    if (!tokens?.accessToken || !currentApplication) {
      set({ detailError: 'Unable to submit application', detailScreenState: 'error' });
      return false;
    }

    set({ detailScreenState: 'submitting', detailError: null });

    try {
      const response = await apiSubmitApplication(tokens.accessToken, currentApplication.id, {
        values: formValues,
      });

      set({
        detailScreenState: 'submitted',
        submittedAt: response.submittedAt,
        successMessage: response.message,
        isDirty: false,
      });

      return true;
    } catch (error) {
      const message = error instanceof ApplicationApiError
        ? error.message
        : applicationErrorMessages.submitFailed;

      set({
        detailScreenState: 'error',
        detailError: message,
      });
      return false;
    }
  },

  /**
   * Clear any displayed error.
   */
  clearError: () => {
    set({ listError: null, detailError: null, listScreenState: 'idle', detailScreenState: 'idle' });
  },

  /**
   * Clear success message.
   */
  clearSuccess: () => {
    set({ successMessage: null });
  },

  /**
   * Reset all application state.
   */
  reset: () => {
    set({
      applications: [],
      listScreenState: 'idle',
      listError: null,
      currentApplication: null,
      detailScreenState: 'idle',
      detailError: null,
      formValues: {},
      formErrors: {},
      isDirty: false,
      lastSavedAt: null,
      successMessage: null,
      submittedAt: null,
    });
  },
}));

/**
 * Selector hooks for common application state.
 */
export const selectApplications = (state: ApplicationState) => state.applications;
export const selectListScreenState = (state: ApplicationState) => state.listScreenState;
export const selectListError = (state: ApplicationState) => state.listError;
export const selectCurrentApplication = (state: ApplicationState) => state.currentApplication;
export const selectDetailScreenState = (state: ApplicationState) => state.detailScreenState;
export const selectDetailError = (state: ApplicationState) => state.detailError;
export const selectFormValues = (state: ApplicationState) => state.formValues;
export const selectFormErrors = (state: ApplicationState) => state.formErrors;
export const selectIsDirty = (state: ApplicationState) => state.isDirty;
export const selectLastSavedAt = (state: ApplicationState) => state.lastSavedAt;
export const selectSuccessMessage = (state: ApplicationState) => state.successMessage;
export const selectSubmittedAt = (state: ApplicationState) => state.submittedAt;
