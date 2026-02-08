/**
 * Tests for application store.
 * Task 1.7: Add tests for form rendering, draft, and submission flows.
 * Uses direct state access (getState/setState) instead of renderHook
 * to avoid React hooks issues in node test environment.
 */

import { useApplicationStore } from '../store/applicationStore';
import { useAuthStore } from '../store/authStore';
import * as applicationService from '../services/applicationService';

// Mock dependencies
jest.mock('../services/apiClient');
jest.mock('../services/applicationService');
jest.mock('../store/authStore', () => ({
  useAuthStore: {
    getState: jest.fn(),
  },
}));

const mockApplicationService = applicationService as jest.Mocked<typeof applicationService>;
const mockGetState = useAuthStore.getState as jest.Mock;

describe('useApplicationStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useApplicationStore.setState({
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
    // Default auth state
    mockGetState.mockReturnValue({
      tokens: { accessToken: 'test-token' },
    });
  });

  describe('loadApplications', () => {
    it('loads applications and updates state', async () => {
      const applications = [
        {
          id: 'app-1',
          title: 'Background Check',
          status: 'pending' as const,
          lifecycleState: 'draft' as const,
          dueDate: '2026-02-10',
          progress: 0,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ];

      mockApplicationService.getApplications.mockResolvedValue({ applications });

      await useApplicationStore.getState().loadApplications();

      const state = useApplicationStore.getState();
      expect(state.applications).toEqual(applications);
      expect(state.listScreenState).toBe('idle');
    });

    it('sets error state on failure', async () => {
      mockApplicationService.getApplications.mockRejectedValue(
        Object.assign(new Error('Failed to load'), {
          name: 'ApplicationApiError',
          code: 'ERROR',
          status: 500,
        })
      );

      await useApplicationStore.getState().loadApplications();

      const state = useApplicationStore.getState();
      expect(state.listScreenState).toBe('error');
      expect(state.listError).toBe('Failed to load');
    });

    it('sets error when not authenticated', async () => {
      mockGetState.mockReturnValue({ tokens: null });

      await useApplicationStore.getState().loadApplications();

      const state = useApplicationStore.getState();
      expect(state.listScreenState).toBe('error');
      expect(state.listError).toBe('Not authenticated');
    });
  });

  describe('loadApplication', () => {
    const mockApplication = {
      id: 'app-1',
      title: 'Background Check',
      status: 'in_progress' as const,
      lifecycleState: 'draft' as const,
      dueDate: '2026-02-10',
      progress: 25,
      sections: [
        {
          id: 'section-1',
          title: 'Personal Info',
          order: 1,
          fields: [
            { id: 'name', label: 'Name', type: 'text' as const, required: true, order: 1 },
          ],
        },
      ],
      createdAt: '2026-01-01',
      updatedAt: '2026-01-15',
    };

    it('loads application with draft values', async () => {
      const draftValues = { name: 'John Doe' };
      const savedAt = Date.now();

      mockApplicationService.getApplication.mockResolvedValue({ application: mockApplication });
      mockApplicationService.getApplicationDraft.mockResolvedValue({
        draft: { applicationId: 'app-1', values: draftValues, savedAt },
      });

      await useApplicationStore.getState().loadApplication('app-1');

      const state = useApplicationStore.getState();
      expect(state.currentApplication).toEqual(mockApplication);
      expect(state.formValues).toEqual(draftValues);
      expect(state.lastSavedAt).toBe(savedAt);
      expect(state.detailScreenState).toBe('idle');
    });

    it('loads application without draft', async () => {
      mockApplicationService.getApplication.mockResolvedValue({ application: mockApplication });
      mockApplicationService.getApplicationDraft.mockResolvedValue({ draft: null });

      await useApplicationStore.getState().loadApplication('app-1');

      const state = useApplicationStore.getState();
      expect(state.formValues).toEqual({});
      expect(state.lastSavedAt).toBeNull();
    });

    it('sets submitted state for submitted application', async () => {
      const submittedApp = { ...mockApplication, status: 'submitted' as const };
      mockApplicationService.getApplication.mockResolvedValue({ application: submittedApp });
      mockApplicationService.getApplicationDraft.mockResolvedValue({ draft: null });

      await useApplicationStore.getState().loadApplication('app-1');

      expect(useApplicationStore.getState().detailScreenState).toBe('submitted');
    });
  });

  describe('setFieldValue', () => {
    it('updates form values and sets dirty flag', () => {
      useApplicationStore.getState().setFieldValue('name', 'John');

      const state = useApplicationStore.getState();
      expect(state.formValues.name).toBe('John');
      expect(state.isDirty).toBe(true);
    });
  });

  describe('setFieldErrors and clearFieldError', () => {
    it('sets and clears field errors', () => {
      useApplicationStore.getState().setFieldErrors({ name: 'Required', email: 'Invalid' });

      expect(useApplicationStore.getState().formErrors).toEqual({ name: 'Required', email: 'Invalid' });

      useApplicationStore.getState().clearFieldError('name');

      expect(useApplicationStore.getState().formErrors).toEqual({ email: 'Invalid' });
    });
  });

  describe('saveDraft', () => {
    it('saves draft and updates state', async () => {
      const savedAt = Date.now();
      useApplicationStore.setState({
        currentApplication: { id: 'app-1' } as any,
        formValues: { name: 'John' },
      });

      mockApplicationService.saveApplicationDraft.mockResolvedValue({
        success: true,
        savedAt,
        lifecycleState: 'draft' as const,
      });

      const success = await useApplicationStore.getState().saveDraft();

      expect(success).toBe(true);
      const state = useApplicationStore.getState();
      expect(state.lastSavedAt).toBe(savedAt);
      expect(state.isDirty).toBe(false);
      expect(state.successMessage).toBe('Draft saved');
    });

    it('sets error state on save failure', async () => {
      useApplicationStore.setState({
        currentApplication: { id: 'app-1' } as any,
        formValues: { name: 'John' },
      });

      mockApplicationService.saveApplicationDraft.mockRejectedValue(
        Object.assign(new Error('Save failed'), {
          name: 'ApplicationApiError',
          code: 'ERROR',
          status: 500,
        })
      );

      const success = await useApplicationStore.getState().saveDraft();

      expect(success).toBe(false);
      const state = useApplicationStore.getState();
      expect(state.detailScreenState).toBe('error');
      expect(state.detailError).toBe('Save failed');
    });
  });

  describe('submitApplication', () => {
    it('submits application and sets submitted state', async () => {
      const submittedAt = '2026-02-03T12:00:00Z';
      useApplicationStore.setState({
        currentApplication: { id: 'app-1' } as any,
        formValues: { name: 'John' },
      });

      mockApplicationService.submitApplication.mockResolvedValue({
        success: true,
        submittedAt,
        message: 'Application submitted successfully!',
        lifecycleState: 'submitted' as const,
      });

      const success = await useApplicationStore.getState().submitApplication();

      expect(success).toBe(true);
      const state = useApplicationStore.getState();
      expect(state.detailScreenState).toBe('submitted');
      expect(state.submittedAt).toBe(submittedAt);
      expect(state.successMessage).toBe('Application submitted successfully!');
      expect(state.isDirty).toBe(false);
    });

    it('sets error state on submit failure', async () => {
      useApplicationStore.setState({
        currentApplication: { id: 'app-1' } as any,
        formValues: { name: 'John' },
      });

      // Create a real error object that matches ApplicationApiError structure
      const mockError = new Error('Validation failed');
      mockError.name = 'ApplicationApiError';
      (mockError as any).code = 'VALIDATION_ERROR';
      (mockError as any).status = 400;
      mockApplicationService.submitApplication.mockRejectedValue(mockError);

      const success = await useApplicationStore.getState().submitApplication();

      expect(success).toBe(false);
      const state = useApplicationStore.getState();
      expect(state.detailScreenState).toBe('error');
      expect(state.detailError).toBe('Validation failed');
    });
  });

  describe('clearError', () => {
    it('clears all errors and resets to idle', () => {
      useApplicationStore.setState({
        listError: 'List error',
        detailError: 'Detail error',
        listScreenState: 'error',
        detailScreenState: 'error',
      });

      useApplicationStore.getState().clearError();

      const state = useApplicationStore.getState();
      expect(state.listError).toBeNull();
      expect(state.detailError).toBeNull();
      expect(state.listScreenState).toBe('idle');
      expect(state.detailScreenState).toBe('idle');
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', () => {
      useApplicationStore.setState({
        applications: [{ id: 'app-1' }] as any,
        currentApplication: { id: 'app-1' } as any,
        formValues: { name: 'John' },
        isDirty: true,
        lastSavedAt: Date.now(),
        successMessage: 'Saved',
      });

      useApplicationStore.getState().reset();

      const state = useApplicationStore.getState();
      expect(state.applications).toEqual([]);
      expect(state.currentApplication).toBeNull();
      expect(state.formValues).toEqual({});
      expect(state.isDirty).toBe(false);
      expect(state.lastSavedAt).toBeNull();
      expect(state.successMessage).toBeNull();
    });
  });
});
