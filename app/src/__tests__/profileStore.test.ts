/**
 * Tests for profile store state management.
 * Task 1.7: Add tests for profile view, edit, and validation flows.
 * Uses direct state access (getState/setState) instead of renderHook
 * to avoid React hooks issues in node test environment.
 */

import { useProfileStore } from '../store/profileStore';
import * as profileService from '../services/profileService';
import { useAuthStore } from '../store/authStore';

// Mock the services
jest.mock('../services/apiClient');
jest.mock('../services/profileService');
jest.mock('../store/authStore', () => ({
  useAuthStore: {
    getState: jest.fn(),
  },
}));

const mockProfileService = profileService as jest.Mocked<typeof profileService>;
const mockGetState = useAuthStore.getState as jest.Mock;

describe('profileStore', () => {
  const mockProfile = {
    id: '1',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '555-1234',
  };

  const mockTokens = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresAt: Date.now() + 3600000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store state
    useProfileStore.setState({
      profile: null,
      screenState: 'idle',
      error: null,
      lastUpdated: null,
      successMessage: null,
    });

    // Mock auth store to return tokens
    mockGetState.mockReturnValue({
      tokens: mockTokens,
    });
  });

  describe('loadProfile', () => {
    it('loads profile successfully', async () => {
      mockProfileService.getProfile.mockResolvedValue(mockProfile);

      await useProfileStore.getState().loadProfile();

      const state = useProfileStore.getState();
      expect(state.profile).toEqual(mockProfile);
      expect(state.screenState).toBe('idle');
      expect(state.error).toBeNull();
      expect(state.lastUpdated).toBeDefined();
    });

    it('sets error state on failure', async () => {
      const error = Object.assign(new Error('Failed to load'), {
        name: 'ProfileApiError',
        code: 'LOAD_FAILED',
        status: 500,
      });
      mockProfileService.getProfile.mockRejectedValue(error);

      await useProfileStore.getState().loadProfile();

      const state = useProfileStore.getState();
      expect(state.profile).toBeNull();
      expect(state.screenState).toBe('error');
      expect(state.error).toBe('Failed to load');
    });

    it('sets error when not authenticated', async () => {
      mockGetState.mockReturnValue({
        tokens: null,
      });

      await useProfileStore.getState().loadProfile();

      const state = useProfileStore.getState();
      expect(state.screenState).toBe('error');
      expect(state.error).toBe('Not authenticated');
    });
  });

  describe('updateProfile', () => {
    const updateData = {
      firstName: 'Jane',
      lastName: 'Doe',
    };

    const updatedProfile = {
      ...mockProfile,
      firstName: 'Jane',
    };

    beforeEach(() => {
      // Set initial profile
      useProfileStore.setState({ profile: mockProfile });
    });

    it('updates profile successfully', async () => {
      mockProfileService.updateProfile.mockResolvedValue(updatedProfile);

      const success = await useProfileStore.getState().updateProfile(updateData);

      expect(success).toBe(true);
      const state = useProfileStore.getState();
      expect(state.profile).toEqual(updatedProfile);
      expect(state.screenState).toBe('success');
      expect(state.successMessage).toBe('Profile updated successfully!');
    });

    it('rolls back on failure', async () => {
      const error = Object.assign(new Error('Failed to save'), {
        name: 'ProfileApiError',
        code: 'SAVE_FAILED',
        status: 500,
      });
      mockProfileService.updateProfile.mockRejectedValue(error);

      const success = await useProfileStore.getState().updateProfile(updateData);

      expect(success).toBe(false);
      const state = useProfileStore.getState();
      // Should rollback to previous profile
      expect(state.profile).toEqual(mockProfile);
      expect(state.screenState).toBe('error');
      expect(state.error).toBe('Failed to save');
    });

    it('sets error when not authenticated', async () => {
      mockGetState.mockReturnValue({
        tokens: null,
      });

      const success = await useProfileStore.getState().updateProfile(updateData);

      expect(success).toBe(false);
      const state = useProfileStore.getState();
      expect(state.screenState).toBe('error');
      expect(state.error).toBe('Not authenticated');
    });
  });

  describe('clearError', () => {
    it('clears error and resets state to idle', () => {
      useProfileStore.setState({
        error: 'Some error',
        screenState: 'error',
      });

      useProfileStore.getState().clearError();

      const state = useProfileStore.getState();
      expect(state.error).toBeNull();
      expect(state.screenState).toBe('idle');
    });
  });

  describe('clearSuccess', () => {
    it('clears success message and resets state to idle', () => {
      useProfileStore.setState({
        successMessage: 'Success!',
        screenState: 'success',
      });

      useProfileStore.getState().clearSuccess();

      const state = useProfileStore.getState();
      expect(state.successMessage).toBeNull();
      expect(state.screenState).toBe('idle');
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', () => {
      useProfileStore.setState({
        profile: mockProfile,
        screenState: 'success',
        error: 'Some error',
        lastUpdated: Date.now(),
        successMessage: 'Success!',
      });

      useProfileStore.getState().reset();

      const state = useProfileStore.getState();
      expect(state.profile).toBeNull();
      expect(state.screenState).toBe('idle');
      expect(state.error).toBeNull();
      expect(state.lastUpdated).toBeNull();
      expect(state.successMessage).toBeNull();
    });
  });
});
