/**
 * Tests for application store.
 * Task 1.7: Add tests for form rendering, draft, and submission flows.
 */

import { act, renderHook } from '@testing-library/react-native';
import { useApplicationStore } from '../store/applicationStore';
import { useAuthStore } from '../store/authStore';
import * as applicationService from '../services/applicationService';

// Mock dependencies
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

      const { result } = renderHook(() => useApplicationStore());

      await act(async () => {
        await result.current.loadApplications();
      });

      expect(result.current.applications).toEqual(applications);
      expect(result.current.listScreenState).toBe('idle');
    });

    it('sets error state on failure', async () => {
      mockApplicationService.getApplications.mockRejectedValue(
        new applicationService.ApplicationApiError('ERROR', 'Failed to load', 500)
      );

      const { result } = renderHook(() => useApplicationStore());

      await act(async () => {
        await result.current.loadApplications();
      });

      expect(result.current.listScreenState).toBe('error');
      expect(result.current.listError).toBe('Failed to load');
    });

    it('sets error when not authenticated', async () => {
      mockGetState.mockReturnValue({ tokens: null });

      const { result } = renderHook(() => useApplicationStore());

      await act(async () => {
        await result.current.loadApplications();
      });

      expect(result.current.listScreenState).toBe('error');
      expect(result.current.listError).toBe('Not authenticated');
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

      const { result } = renderHook(() => useApplicationStore());

      await act(async () => {
        await result.current.loadApplication('app-1');
      });

      expect(result.current.currentApplication).toEqual(mockApplication);
      expect(result.current.formValues).toEqual(draftValues);
      expect(result.current.lastSavedAt).toBe(savedAt);
      expect(result.current.detailScreenState).toBe('idle');
    });

    it('loads application without draft', async () => {
      mockApplicationService.getApplication.mockResolvedValue({ application: mockApplication });
      mockApplicationService.getApplicationDraft.mockResolvedValue({ draft: null });

      const { result } = renderHook(() => useApplicationStore());

      await act(async () => {
        await result.current.loadApplication('app-1');
      });

      expect(result.current.formValues).toEqual({});
      expect(result.current.lastSavedAt).toBeNull();
    });

    it('sets submitted state for submitted application', async () => {
      const submittedApp = { ...mockApplication, status: 'submitted' as const };
      mockApplicationService.getApplication.mockResolvedValue({ application: submittedApp });
      mockApplicationService.getApplicationDraft.mockResolvedValue({ draft: null });

      const { result } = renderHook(() => useApplicationStore());

      await act(async () => {
        await result.current.loadApplication('app-1');
      });

      expect(result.current.detailScreenState).toBe('submitted');
    });
  });

  describe('setFieldValue', () => {
    it('updates form values and sets dirty flag', () => {
      const { result } = renderHook(() => useApplicationStore());

      act(() => {
        result.current.setFieldValue('name', 'John');
      });

      expect(result.current.formValues.name).toBe('John');
      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('setFieldErrors and clearFieldError', () => {
    it('sets and clears field errors', () => {
      const { result } = renderHook(() => useApplicationStore());

      act(() => {
        result.current.setFieldErrors({ name: 'Required', email: 'Invalid' });
      });

      expect(result.current.formErrors).toEqual({ name: 'Required', email: 'Invalid' });

      act(() => {
        result.current.clearFieldError('name');
      });

      expect(result.current.formErrors).toEqual({ email: 'Invalid' });
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

      const { result } = renderHook(() => useApplicationStore());

      await act(async () => {
        const success = await result.current.saveDraft();
        expect(success).toBe(true);
      });

      expect(result.current.lastSavedAt).toBe(savedAt);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.successMessage).toBe('Draft saved');
    });

    it('sets error state on save failure', async () => {
      useApplicationStore.setState({
        currentApplication: { id: 'app-1' } as any,
        formValues: { name: 'John' },
      });

      mockApplicationService.saveApplicationDraft.mockRejectedValue(
        new applicationService.ApplicationApiError('ERROR', 'Save failed', 500)
      );

      const { result } = renderHook(() => useApplicationStore());

      await act(async () => {
        const success = await result.current.saveDraft();
        expect(success).toBe(false);
      });

      expect(result.current.detailScreenState).toBe('error');
      expect(result.current.detailError).toBe('Save failed');
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

      const { result } = renderHook(() => useApplicationStore());

      await act(async () => {
        const success = await result.current.submitApplication();
        expect(success).toBe(true);
      });

      expect(result.current.detailScreenState).toBe('submitted');
      expect(result.current.submittedAt).toBe(submittedAt);
      expect(result.current.successMessage).toBe('Application submitted successfully!');
      expect(result.current.isDirty).toBe(false);
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

      const { result } = renderHook(() => useApplicationStore());

      await act(async () => {
        const success = await result.current.submitApplication();
        expect(success).toBe(false);
      });

      expect(result.current.detailScreenState).toBe('error');
      expect(result.current.detailError).toBe('Validation failed');
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

      const { result } = renderHook(() => useApplicationStore());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.listError).toBeNull();
      expect(result.current.detailError).toBeNull();
      expect(result.current.listScreenState).toBe('idle');
      expect(result.current.detailScreenState).toBe('idle');
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

      const { result } = renderHook(() => useApplicationStore());

      act(() => {
        result.current.reset();
      });

      expect(result.current.applications).toEqual([]);
      expect(result.current.currentApplication).toBeNull();
      expect(result.current.formValues).toEqual({});
      expect(result.current.isDirty).toBe(false);
      expect(result.current.lastSavedAt).toBeNull();
      expect(result.current.successMessage).toBeNull();
    });
  });
});
