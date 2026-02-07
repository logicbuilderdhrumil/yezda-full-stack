import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useThemeStore } from '../themeStore';
import { useLocaleStore } from '../localeStore';
import { usePresenceStore } from '../presenceStore';
import { useRouteKeyStore, selectHasNavigated } from '../routeKeyStore';
import { useAuthStore } from '../authStore';
import { resetAllStores, handleLogout, handleLogin } from '../storeUtils';
import type { AuthSession } from '@/@types/auth';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
const createMatchMediaMock = (matches: boolean) => ({
  matches,
  media: '(prefers-color-scheme: dark)',
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

describe('themeStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    window.matchMedia = vi.fn().mockReturnValue(createMatchMediaMock(false));
    useThemeStore.setState({ mode: 'system', resolvedTheme: 'light' });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default state', () => {
    const state = useThemeStore.getState();
    expect(state.mode).toBe('system');
    expect(state.resolvedTheme).toBe('light');
  });

  it('should set theme mode to dark', () => {
    useThemeStore.getState().setMode('dark');
    const state = useThemeStore.getState();
    expect(state.mode).toBe('dark');
    expect(state.resolvedTheme).toBe('dark');
  });

  it('should set theme mode to light', () => {
    useThemeStore.getState().setMode('light');
    const state = useThemeStore.getState();
    expect(state.mode).toBe('light');
    expect(state.resolvedTheme).toBe('light');
  });

  it('should resolve system mode based on matchMedia (light)', () => {
    window.matchMedia = vi.fn().mockReturnValue(createMatchMediaMock(false));
    useThemeStore.getState().setMode('system');
    expect(useThemeStore.getState().resolvedTheme).toBe('light');
  });

  it('should resolve system mode based on matchMedia (dark)', () => {
    window.matchMedia = vi.fn().mockReturnValue(createMatchMediaMock(true));
    useThemeStore.getState().setMode('system');
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
  });

  it('should toggle from light to dark', () => {
    useThemeStore.getState().setMode('light');
    useThemeStore.getState().toggle();
    const state = useThemeStore.getState();
    expect(state.mode).toBe('dark');
    expect(state.resolvedTheme).toBe('dark');
  });

  it('should toggle from dark to light', () => {
    useThemeStore.getState().setMode('dark');
    useThemeStore.getState().toggle();
    const state = useThemeStore.getState();
    expect(state.mode).toBe('light');
    expect(state.resolvedTheme).toBe('light');
  });

  it('should toggle from system mode based on resolved theme', () => {
    window.matchMedia = vi.fn().mockReturnValue(createMatchMediaMock(true));
    useThemeStore.getState().setMode('system');
    // Resolved is dark, so toggle should go to light
    useThemeStore.getState().toggle();
    const state = useThemeStore.getState();
    expect(state.mode).toBe('light');
    expect(state.resolvedTheme).toBe('light');
  });

  it('should refresh resolved theme for system mode', () => {
    window.matchMedia = vi.fn().mockReturnValue(createMatchMediaMock(false));
    useThemeStore.getState().setMode('system');
    expect(useThemeStore.getState().resolvedTheme).toBe('light');

    // Simulate system preference change
    window.matchMedia = vi.fn().mockReturnValue(createMatchMediaMock(true));
    useThemeStore.getState().refreshResolved();
    expect(useThemeStore.getState().resolvedTheme).toBe('dark');
  });

  it('should reset to default state', () => {
    useThemeStore.getState().setMode('dark');
    useThemeStore.getState().reset();
    const state = useThemeStore.getState();
    expect(state.mode).toBe('system');
  });
});

describe('localeStore', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useLocaleStore.setState({ locale: 'en', isLoading: false });
  });

  it('should initialize with default locale', () => {
    const state = useLocaleStore.getState();
    expect(state.locale).toBe('en');
    expect(state.isLoading).toBe(false);
  });

  it('should set locale', () => {
    useLocaleStore.getState().setLocale('fr');
    expect(useLocaleStore.getState().locale).toBe('fr');
  });

  it('should set loading state', () => {
    useLocaleStore.getState().setLoading(true);
    expect(useLocaleStore.getState().isLoading).toBe(true);
  });

  it('should reset to default locale', () => {
    useLocaleStore.getState().setLocale('de');
    useLocaleStore.getState().reset();
    expect(useLocaleStore.getState().locale).toBe('en');
  });

  it('should persist locale after setLocale', () => {
    useLocaleStore.getState().setLocale('es');
    expect(useLocaleStore.getState().locale).toBe('es');
    expect(useLocaleStore.getState().isLoading).toBe(false);
  });
});

describe('presenceStore', () => {
  beforeEach(() => {
    usePresenceStore.setState({ status: 'offline', lastActivity: null });
  });

  it('should initialize as offline', () => {
    const state = usePresenceStore.getState();
    expect(state.status).toBe('offline');
    expect(state.lastActivity).toBeNull();
  });

  it('should go online', () => {
    usePresenceStore.getState().goOnline();
    const state = usePresenceStore.getState();
    expect(state.status).toBe('online');
    expect(state.lastActivity).not.toBeNull();
  });

  it('should go away', () => {
    usePresenceStore.getState().goAway();
    expect(usePresenceStore.getState().status).toBe('away');
  });

  it('should go busy', () => {
    usePresenceStore.getState().goBusy();
    expect(usePresenceStore.getState().status).toBe('busy');
  });

  it('should go offline and clear lastActivity', () => {
    usePresenceStore.getState().goOnline();
    usePresenceStore.getState().goOffline();
    const state = usePresenceStore.getState();
    expect(state.status).toBe('offline');
    expect(state.lastActivity).toBeNull();
  });

  it('should update activity timestamp', () => {
    const before = Date.now();
    usePresenceStore.getState().updateActivity();
    const after = Date.now();
    const activity = usePresenceStore.getState().lastActivity!;
    expect(activity).toBeGreaterThanOrEqual(before);
    expect(activity).toBeLessThanOrEqual(after);
  });

  it('should reset to initial state', () => {
    usePresenceStore.getState().goOnline();
    usePresenceStore.getState().reset();
    const state = usePresenceStore.getState();
    expect(state.status).toBe('offline');
    expect(state.lastActivity).toBeNull();
  });
});

describe('routeKeyStore', () => {
  beforeEach(() => {
    useRouteKeyStore.setState({ currentKey: null, previousKey: null });
  });

  it('should initialize with null keys', () => {
    const state = useRouteKeyStore.getState();
    expect(state.currentKey).toBeNull();
    expect(state.previousKey).toBeNull();
  });

  it('should set route key and track previous', () => {
    useRouteKeyStore.getState().setRouteKey('page-1');
    expect(useRouteKeyStore.getState().currentKey).toBe('page-1');
    expect(useRouteKeyStore.getState().previousKey).toBeNull();

    useRouteKeyStore.getState().setRouteKey('page-2');
    expect(useRouteKeyStore.getState().currentKey).toBe('page-2');
    expect(useRouteKeyStore.getState().previousKey).toBe('page-1');
  });

  it('should clear route keys', () => {
    useRouteKeyStore.getState().setRouteKey('page-1');
    useRouteKeyStore.getState().clearRouteKey();
    const state = useRouteKeyStore.getState();
    expect(state.currentKey).toBeNull();
    expect(state.previousKey).toBeNull();
  });

  it('should reset to initial state', () => {
    useRouteKeyStore.getState().setRouteKey('page-1');
    useRouteKeyStore.getState().reset();
    const state = useRouteKeyStore.getState();
    expect(state.currentKey).toBeNull();
    expect(state.previousKey).toBeNull();
  });

  describe('selectHasNavigated', () => {
    it('should return false when no navigation has occurred', () => {
      expect(selectHasNavigated(useRouteKeyStore.getState())).toBe(false);
    });

    it('should return false when only one key is set', () => {
      useRouteKeyStore.getState().setRouteKey('page-1');
      expect(selectHasNavigated(useRouteKeyStore.getState())).toBe(false);
    });

    it('should return true when navigation occurred', () => {
      useRouteKeyStore.getState().setRouteKey('page-1');
      useRouteKeyStore.getState().setRouteKey('page-2');
      expect(selectHasNavigated(useRouteKeyStore.getState())).toBe(true);
    });

    it('should return false when navigating to same key', () => {
      useRouteKeyStore.getState().setRouteKey('page-1');
      useRouteKeyStore.getState().setRouteKey('page-2');
      // Set another key
      useRouteKeyStore.setState({ currentKey: 'page-1', previousKey: 'page-1' });
      expect(selectHasNavigated(useRouteKeyStore.getState())).toBe(false);
    });
  });
});

describe('storeUtils', () => {
  const mockSession: AuthSession = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresAt: Date.now() + 3600000,
    user: {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: ['viewer'],
      type: 'user',
      mfaEnabled: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  };

  beforeEach(() => {
    localStorageMock.clear();
    window.matchMedia = vi.fn().mockReturnValue(createMatchMediaMock(false));
    // Reset all stores to known state
    useAuthStore.setState({
      session: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
      mfaPending: false,
      mfaToken: null,
    });
    useThemeStore.setState({ mode: 'system', resolvedTheme: 'light' });
    useLocaleStore.setState({ locale: 'en', isLoading: false });
    usePresenceStore.setState({ status: 'offline', lastActivity: null });
    useRouteKeyStore.setState({ currentKey: null, previousKey: null });
  });

  describe('handleLogin', () => {
    it('should set presence to online', () => {
      handleLogin();
      expect(usePresenceStore.getState().status).toBe('online');
      expect(usePresenceStore.getState().lastActivity).not.toBeNull();
    });
  });

  describe('handleLogout', () => {
    it('should clear auth session', () => {
      useAuthStore.getState().setSession(mockSession);
      handleLogout();
      expect(useAuthStore.getState().session).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('should set presence to offline', () => {
      usePresenceStore.getState().goOnline();
      handleLogout();
      expect(usePresenceStore.getState().status).toBe('offline');
    });

    it('should reset route keys', () => {
      useRouteKeyStore.getState().setRouteKey('page-1');
      handleLogout();
      expect(useRouteKeyStore.getState().currentKey).toBeNull();
    });

    it('should preserve theme preference', () => {
      useThemeStore.getState().setMode('dark');
      handleLogout();
      expect(useThemeStore.getState().mode).toBe('dark');
    });

    it('should preserve locale preference', () => {
      useLocaleStore.getState().setLocale('fr');
      handleLogout();
      expect(useLocaleStore.getState().locale).toBe('fr');
    });
  });

  describe('resetAllStores', () => {
    it('should reset all stores to initial state', () => {
      // Set up non-default states
      useAuthStore.getState().setSession(mockSession);
      useThemeStore.getState().setMode('dark');
      useLocaleStore.getState().setLocale('fr');
      usePresenceStore.getState().goOnline();
      useRouteKeyStore.getState().setRouteKey('page-1');

      resetAllStores();

      expect(useAuthStore.getState().session).toBeNull();
      expect(useThemeStore.getState().mode).toBe('system');
      expect(useLocaleStore.getState().locale).toBe('en');
      expect(usePresenceStore.getState().status).toBe('offline');
      expect(useRouteKeyStore.getState().currentKey).toBeNull();
    });
  });
});
