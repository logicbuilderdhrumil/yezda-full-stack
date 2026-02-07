import { create } from 'zustand';
import type { PresenceState } from '@/@types/stores';
import type { PresenceStatus } from '@/@types/socket';

interface PresenceStore extends PresenceState {
  /** Set the user's presence status. */
  setStatus: (status: PresenceStatus) => void;
  /** Update the last activity timestamp. */
  updateActivity: () => void;
  /** Set user as online. */
  goOnline: () => void;
  /** Set user as away. */
  goAway: () => void;
  /** Set user as busy. */
  goBusy: () => void;
  /** Set user as offline. */
  goOffline: () => void;
  /** Reset to initial state. */
  reset: () => void;
}

const initialState: PresenceState = {
  status: 'offline',
  lastActivity: null,
};

/**
 * Presence store for managing realtime user status.
 * Not persisted - resets to offline on reload.
 */
export const usePresenceStore = create<PresenceStore>()((set) => ({
  ...initialState,

  setStatus: (status: PresenceStatus) => {
    set({ status, lastActivity: Date.now() });
  },

  updateActivity: () => {
    set({ lastActivity: Date.now() });
  },

  goOnline: () => {
    set({ status: 'online', lastActivity: Date.now() });
  },

  goAway: () => {
    set({ status: 'away', lastActivity: Date.now() });
  },

  goBusy: () => {
    set({ status: 'busy', lastActivity: Date.now() });
  },

  goOffline: () => {
    set({ status: 'offline', lastActivity: null });
  },

  reset: () => {
    set(initialState);
  },
}));

/** Selector for presence status. */
export const selectPresenceStatus = (state: PresenceStore): PresenceStatus =>
  state.status;

/** Selector for last activity timestamp. */
export const selectLastActivity = (state: PresenceStore): number | null =>
  state.lastActivity;

/** Selector for whether user is available. */
export const selectIsAvailable = (state: PresenceStore): boolean =>
  state.status === 'online';
