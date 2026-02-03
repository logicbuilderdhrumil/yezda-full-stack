import { create } from 'zustand';
import type { RouteKeyState } from '@/@types/stores';

interface RouteKeyStore extends RouteKeyState {
  /** Set the current route key. */
  setRouteKey: (key: string) => void;
  /** Clear the route key. */
  clearRouteKey: () => void;
  /** Reset to initial state. */
  reset: () => void;
}

const initialState: RouteKeyState = {
  currentKey: null,
  previousKey: null,
};

/**
 * Route key store for managing layout-level navigation state.
 * Not persisted - resets on page reload.
 */
export const useRouteKeyStore = create<RouteKeyStore>()((set, get) => ({
  ...initialState,

  setRouteKey: (key: string) => {
    const { currentKey } = get();
    set({
      currentKey: key,
      previousKey: currentKey,
    });
  },

  clearRouteKey: () => {
    set({
      currentKey: null,
      previousKey: null,
    });
  },

  reset: () => {
    set(initialState);
  },
}));

/** Selector for current route key. */
export const selectCurrentRouteKey = (state: RouteKeyStore): string | null =>
  state.currentKey;

/** Selector for previous route key. */
export const selectPreviousRouteKey = (state: RouteKeyStore): string | null =>
  state.previousKey;

/** Selector for whether navigation has occurred (keys differ). */
export const selectHasNavigated = (state: RouteKeyStore): boolean =>
  state.previousKey !== null && state.currentKey !== state.previousKey;
