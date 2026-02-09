/**
 * Profile state store using Zustand.
 * Task 1.4: Profile loading states.
 * Task 1.5: Profile update with optimistic feedback.
 */

import { create } from 'zustand';
import {
  UserProfile,
  ProfileUpdateRequest,
  ProfileScreenState,
} from '../types/profile.types';
import {
  getProfile as apiGetProfile,
  updateProfile as apiUpdateProfile,
  ProfileApiError,
} from '../services/profileService';
import { useAuthStore } from './authStore';

interface ProfileState {
  profile: UserProfile | null;
  screenState: ProfileScreenState;
  error: string | null;
  lastUpdated: number | null;
  successMessage: string | null;

  // Actions
  loadProfile: () => Promise<void>;
  updateProfile: (data: ProfileUpdateRequest) => Promise<boolean>;
  clearError: () => void;
  clearSuccess: () => void;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  // Initial state
  profile: null,
  screenState: 'idle',
  error: null,
  lastUpdated: null,
  successMessage: null,

  /**
   * Load the user's profile from the API.
   */
  loadProfile: async () => {
    const tokens = useAuthStore.getState().tokens;
    if (!tokens?.accessToken) {
      set({ error: 'Not authenticated', screenState: 'error' });
      return;
    }

    set({ screenState: 'loading', error: null });

    try {
      const profile = await apiGetProfile(tokens.accessToken);
      set({
        profile,
        screenState: 'idle',
        lastUpdated: Date.now(),
      });
    } catch (error) {
      // Duck-type check for API errors to handle mock compatibility
      const isApiError = error instanceof Error &&
        (error instanceof ProfileApiError || (error.name === 'ProfileApiError' || ('code' in error && 'status' in error)));
      const message = isApiError ? error.message : 'Unable to load profile. Please try again.';

      set({
        screenState: 'error',
        error: message,
      });
    }
  },

  /**
   * Update the user's profile with optimistic feedback.
   */
  updateProfile: async (data: ProfileUpdateRequest) => {
    const tokens = useAuthStore.getState().tokens;
    if (!tokens?.accessToken) {
      set({ error: 'Not authenticated', screenState: 'error' });
      return false;
    }

    const { profile: previousProfile } = get();

    // Optimistic update
    if (previousProfile) {
      set({
        profile: {
          ...previousProfile,
          ...data,
          address: data.address ?? previousProfile.address,
        },
        screenState: 'saving',
        error: null,
        successMessage: null,
      });
    } else {
      set({ screenState: 'saving', error: null, successMessage: null });
    }

    try {
      const updatedProfile = await apiUpdateProfile(tokens.accessToken, data);
      set({
        profile: updatedProfile,
        screenState: 'success',
        lastUpdated: Date.now(),
        successMessage: 'Profile updated successfully!',
      });
      return true;
    } catch (error) {
      // Rollback on failure - duck-type check for API errors
      const isApiError = error instanceof Error &&
        (error instanceof ProfileApiError || (error.name === 'ProfileApiError' || ('code' in error && 'status' in error)));
      const message = isApiError ? error.message : 'Unable to save changes. Please try again.';

      set({
        profile: previousProfile,
        screenState: 'error',
        error: message,
      });
      return false;
    }
  },

  /**
   * Clear any displayed error.
   */
  clearError: () => {
    set({ error: null, screenState: 'idle' });
  },

  /**
   * Clear success message.
   */
  clearSuccess: () => {
    set({ successMessage: null, screenState: 'idle' });
  },

  /**
   * Reset the profile state.
   */
  reset: () => {
    set({
      profile: null,
      screenState: 'idle',
      error: null,
      lastUpdated: null,
      successMessage: null,
    });
  },
}));

/**
 * Selector hooks for common profile state.
 */
export const selectProfile = (state: ProfileState) => state.profile;
export const selectProfileScreenState = (state: ProfileState) => state.screenState;
export const selectProfileError = (state: ProfileState) => state.error;
export const selectProfileSuccess = (state: ProfileState) => state.successMessage;
