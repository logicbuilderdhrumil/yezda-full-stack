/**
 * Tests for profile store state management.
 * Task 1.7: Add tests for profile view, edit, and validation flows.
 */

import { act, renderHook } from '@testing-library/react-hooks';
import { useProfileStore } from '../store/profileStore';
import * as profileService from '../services/profileService';
import { useAuthStore } from '../store/authStore';

// Mock the services
jest.mock('../services/profileService');
jest.mock('../store/authStore');

const mockProfileService = profileService as jest.Mocked<typeof profileService>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

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
    // Reset store state
    useProfileStore.setState({
      profile: null,
      screenState: 'idle',
      error: null,
      lastUpdated: null,
      successMessage: null,
    });

    // Mock auth store to return tokens
    (mockUseAuthStore as any).getState = jest.fn().mockReturnValue({
      tokens: mockTokens,
    });
  });

  describe('loadProfile', () => {
    it('loads profile successfully', async () => {
      mockProfileService.getProfile.mockResolvedValue(mockProfile);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.loadProfile();
      });

      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.screenState).toBe('idle');
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeDefined();
    });

    it('sets error state on failure', async () => {
      const error = new profileService.ProfileApiError(
        'LOAD_FAILED',
        'Failed to load',
        500
      );
      mockProfileService.getProfile.mockRejectedValue(error);

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.loadProfile();
      });

      expect(result.current.profile).toBeNull();
      expect(result.current.screenState).toBe('error');
      expect(result.current.error).toBe('Failed to load');
    });

    it('sets error when not authenticated', async () => {
      (mockUseAuthStore as any).getState = jest.fn().mockReturnValue({
        tokens: null,
      });

      const { result } = renderHook(() => useProfileStore());

      await act(async () => {
        await result.current.loadProfile();
      });

      expect(result.current.screenState).toBe('error');
      expect(result.current.error).toBe('Not authenticated');
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

      const { result } = renderHook(() => useProfileStore());

      let success: boolean;
      await act(async () => {
        success = await result.current.updateProfile(updateData);
      });

      expect(success!).toBe(true);
      expect(result.current.profile).toEqual(updatedProfile);
      expect(result.current.screenState).toBe('success');
      expect(result.current.successMessage).toBe('Profile updated successfully!');
    });

    it('performs optimistic update', async () => {
      mockProfileService.updateProfile.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(updatedProfile), 100)
          )
      );

      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.updateProfile(updateData);
      });

      // Check optimistic update happened immediately
      expect(result.current.screenState).toBe('saving');
      expect(result.current.profile?.firstName).toBe('Jane');
    });

    it('rolls back on failure', async () => {
      const error = new profileService.ProfileApiError(
        'SAVE_FAILED',
        'Failed to save',
        500
      );
      mockProfileService.updateProfile.mockRejectedValue(error);

      const { result } = renderHook(() => useProfileStore());

      let success: boolean;
      await act(async () => {
        success = await result.current.updateProfile(updateData);
      });

      expect(success!).toBe(false);
      // Should rollback to previous profile
      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.screenState).toBe('error');
      expect(result.current.error).toBe('Failed to save');
    });

    it('sets error when not authenticated', async () => {
      (mockUseAuthStore as any).getState = jest.fn().mockReturnValue({
        tokens: null,
      });

      const { result } = renderHook(() => useProfileStore());

      let success: boolean;
      await act(async () => {
        success = await result.current.updateProfile(updateData);
      });

      expect(success!).toBe(false);
      expect(result.current.screenState).toBe('error');
      expect(result.current.error).toBe('Not authenticated');
    });
  });

  describe('clearError', () => {
    it('clears error and resets state to idle', () => {
      useProfileStore.setState({
        error: 'Some error',
        screenState: 'error',
      });

      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.screenState).toBe('idle');
    });
  });

  describe('clearSuccess', () => {
    it('clears success message and resets state to idle', () => {
      useProfileStore.setState({
        successMessage: 'Success!',
        screenState: 'success',
      });

      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.clearSuccess();
      });

      expect(result.current.successMessage).toBeNull();
      expect(result.current.screenState).toBe('idle');
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

      const { result } = renderHook(() => useProfileStore());

      act(() => {
        result.current.reset();
      });

      expect(result.current.profile).toBeNull();
      expect(result.current.screenState).toBe('idle');
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeNull();
      expect(result.current.successMessage).toBeNull();
    });
  });
});
