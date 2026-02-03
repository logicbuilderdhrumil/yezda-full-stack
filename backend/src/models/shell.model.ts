/**
 * Shell Configuration Models
 * Task 1.1: Define shell configuration and navigation schemas
 */

/**
 * Shell layout metadata for header, sidebar, and content areas
 */
export interface ShellLayout {
  header: {
    visible: boolean;
    title?: string;
    logoUrl?: string;
    showSearch?: boolean;
    showNotifications?: boolean;
  };
  sidebar: {
    visible: boolean;
    collapsible: boolean;
    defaultCollapsed: boolean;
    position: 'left' | 'right';
  };
  content: {
    maxWidth?: string;
    padding?: string;
  };
}

/**
 * Shell configuration response returned by the API
 */
export interface ShellConfig {
  version: string;
  layout: ShellLayout;
  features: ShellFeatures;
  branding: ShellBranding;
}

/**
 * Feature flags for the shell
 */
export interface ShellFeatures {
  mfaEnabled: boolean;
  notificationsEnabled: boolean;
  themeToggle: boolean;
  languageSwitch: boolean;
}

/**
 * Branding configuration
 */
export interface ShellBranding {
  appName: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
}

/**
 * Navigation item with role-based access
 */
export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  path: string;
  authorities: string[];
  children?: NavItem[];
  badge?: NavBadge;
  hidden?: boolean;
}

/**
 * Navigation badge for displaying counts or statuses
 */
export interface NavBadge {
  type: 'count' | 'dot' | 'text';
  value?: string | number;
  color?: 'info' | 'success' | 'warning' | 'error';
}

/**
 * Navigation metadata returned by the API
 */
export interface NavigationConfig {
  items: NavItem[];
  defaultPath: string;
}

/**
 * Route policy for access control
 */
export interface RoutePolicy {
  route: string;
  pattern?: string;
  public: boolean;
  authorities?: string[];
  methods?: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[];
}

/**
 * Route policies response
 */
export interface RoutePoliciesConfig {
  version: string;
  policies: RoutePolicy[];
}

/**
 * Theme preference types
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Locale preference
 */
export interface LocaleConfig {
  code: string;
  name: string;
  direction: 'ltr' | 'rtl';
}

/**
 * Theme and locale preference defaults
 */
export interface PreferenceDefaults {
  theme: ThemeMode;
  locale: LocaleConfig;
  availableThemes: ThemeMode[];
  availableLocales: LocaleConfig[];
}

/**
 * User preference entity stored in database
 */
export interface UserPreference {
  id: string;
  userId: string;
  userType: 'user' | 'candidate';
  tenantId?: string;
  theme: ThemeMode;
  localeCode: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Preference update request
 */
export interface PreferenceUpdateRequest {
  theme?: ThemeMode;
  localeCode?: string;
}

/**
 * Audit event types for shell operations
 */
export type ShellAuditEventType =
  | 'SHELL_PREFERENCE_UPDATED'
  | 'SHELL_NAVIGATION_POLICY_UPDATED'
  | 'SHELL_CONFIG_ACCESSED';
