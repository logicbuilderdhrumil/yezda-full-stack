import type { IShellRepository } from '../../domain/ports/IShellRepository.js';
import type { ShellConfig, RoutePolicy, NavigationItem, PreferenceDefaults, UserShellPreferences } from '../../domain/entities/shell.entity.js';

const shellConfig: ShellConfig = { layout: 'sidebar', sidebar: true, topbar: true, footer: true };
const routePolicies: RoutePolicy[] = [
  { path: '/dashboard', roles: ['admin', 'manager', 'agent', 'viewer'], public: false },
  { path: '/login', roles: [], public: true },
];
const defaultNav: NavigationItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'home' },
  { label: 'Candidates', path: '/candidates', icon: 'users', roles: ['admin', 'manager', 'agent'] },
  { label: 'Settings', path: '/settings', icon: 'settings', roles: ['admin'] },
];
const userPrefs = new Map<string, UserShellPreferences>();

export class InMemoryShellRepository implements IShellRepository {
  getConfig(): ShellConfig { return shellConfig; }
  getRoutePolicies(): RoutePolicy[] { return routePolicies; }
  getNavigation(_userId: string, roles: string[]): NavigationItem[] { return defaultNav.filter((n) => !n.roles || n.roles.some((r) => roles.includes(r))); }
  getPreferenceDefaults(): PreferenceDefaults { return { theme: 'system', locale: 'en-US' }; }
  getUserPreferences(userId: string): UserShellPreferences { return userPrefs.get(userId) ?? {}; }
  updateUserPreferences(userId: string, prefs: Partial<UserShellPreferences>): UserShellPreferences { const current = this.getUserPreferences(userId); const updated = { ...current, ...prefs }; userPrefs.set(userId, updated); return updated; }
}
