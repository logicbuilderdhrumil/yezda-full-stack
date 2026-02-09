/**
 * Template Layouts Domain Entities
 */
export interface HeaderNavItem { id: string; label: string; icon?: string; path?: string; action?: 'link' | 'dropdown' | 'button'; children?: HeaderNavItem[]; authorities?: string[]; }
export interface SideNavItem { id: string; label: string; icon?: string; path: string; authorities?: string[]; badge?: { type: 'count' | 'dot' | 'text'; value?: string | number; color?: 'info' | 'success' | 'warning' | 'error'; }; children?: SideNavItem[]; order?: number; }
export interface HeaderMetadata { title: string; logoUrl?: string; showSearch: boolean; showNotifications: boolean; showProfile: boolean; navItems: HeaderNavItem[]; }
export interface SideNavMetadata { visible: boolean; collapsible: boolean; defaultCollapsed: boolean; position: 'left' | 'right'; items: SideNavItem[]; }
export interface TemplateLayoutNavigation { header: HeaderMetadata; sideNav: SideNavMetadata; version: string; }
export interface ProfileSummary { id: string; displayName: string; email: string; avatarUrl?: string; role: string; organizationName?: string; tenantId?: string; }
export interface NotificationSummary { unreadCount: number; hasUrgent: boolean; lastUpdated: Date; }
export interface GlobalControlSummary { profile: ProfileSummary; notifications: NotificationSummary; }
export interface LayoutAccessContext { userId: string; userType: 'user' | 'candidate'; tenantId?: string; authorities: string[]; }
export type TemplateLayoutAuditEventType = 'LAYOUT_NAVIGATION_ACCESSED' | 'LAYOUT_PROFILE_SUMMARY_ACCESSED' | 'LAYOUT_ACCESS_DENIED' | 'LAYOUT_RATE_LIMITED';
export interface RequestContext { userId: string; userType: 'user' | 'candidate'; tenantId: string; ipAddress?: string; channel?: 'web' | 'mobile' | 'api'; }
export type OperationResult<T> = { success: true; data: T } | { success: false; error: string; code: string };
