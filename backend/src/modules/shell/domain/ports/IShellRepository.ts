import type { ShellConfig, RoutePolicy, NavigationItem, PreferenceDefaults, UserShellPreferences } from '../entities/shell.entity.js';
export interface IShellRepository {
  getConfig(): ShellConfig;
  getRoutePolicies(): RoutePolicy[];
  getNavigation(userId: string, roles: string[]): NavigationItem[];
  getPreferenceDefaults(): PreferenceDefaults;
  getUserPreferences(userId: string): UserShellPreferences;
  updateUserPreferences(userId: string, prefs: Partial<UserShellPreferences>): UserShellPreferences;
}
