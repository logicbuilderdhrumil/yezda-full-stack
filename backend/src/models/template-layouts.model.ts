/**
 * Template Layouts Models
 * Task 1.1: Define layout control data schemas
 */

/**
 * Header navigation item
 */
export interface HeaderNavItem {
  id: string;
  label: string;
  icon?: string;
  path?: string;
  action?: 'link' | 'dropdown' | 'button';
  children?: HeaderNavItem[];
  authorities?: string[];
}

/**
 * Side navigation item
 */
export interface SideNavItem {
  id: string;
  label: string;
  icon?: string;
  path: string;
  authorities?: string[];
  badge?: {
    type: 'count' | 'dot' | 'text';
    value?: string | number;
    color?: 'info' | 'success' | 'warning' | 'error';
  };
  children?: SideNavItem[];
  order?: number;
}

/**
 * Header metadata for template layout
 */
export interface HeaderMetadata {
  title: string;
  logoUrl?: string;
  showSearch: boolean;
  showNotifications: boolean;
  showProfile: boolean;
  navItems: HeaderNavItem[];
}

/**
 * Side navigation metadata for template layout
 */
export interface SideNavMetadata {
  visible: boolean;
  collapsible: boolean;
  defaultCollapsed: boolean;
  position: 'left' | 'right';
  items: SideNavItem[];
}

/**
 * Template layout navigation response
 */
export interface TemplateLayoutNavigation {
  header: HeaderMetadata;
  sideNav: SideNavMetadata;
  version: string;
}

/**
 * User profile summary for template controls
 */
export interface ProfileSummary {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  role: string;
  organizationName?: string;
  tenantId?: string;
}

/**
 * Notification summary for template controls
 */
export interface NotificationSummary {
  unreadCount: number;
  hasUrgent: boolean;
  lastUpdated: Date;
}

/**
 * Global control summary response
 */
export interface GlobalControlSummary {
  profile: ProfileSummary;
  notifications: NotificationSummary;
}

/**
 * Layout access request context
 */
export interface LayoutAccessContext {
  userId: string;
  userType: 'user' | 'candidate';
  tenantId?: string;
  authorities: string[];
}

/**
 * Audit event types for template layout operations
 */
export type TemplateLayoutAuditEventType =
  | 'LAYOUT_NAVIGATION_ACCESSED'
  | 'LAYOUT_PROFILE_SUMMARY_ACCESSED'
  | 'LAYOUT_ACCESS_DENIED'
  | 'LAYOUT_RATE_LIMITED';
