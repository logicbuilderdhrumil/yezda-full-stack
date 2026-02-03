/**
 * Types for application navigation configuration.
 */

import type { UserRole } from './auth';

/** Icon names supported in navigation configuration. */
export type NavIconName =
  | 'home'
  | 'users'
  | 'building'
  | 'file-text'
  | 'settings'
  | 'shield'
  | 'credit-card'
  | 'bar-chart'
  | 'message-circle'
  | 'bell'
  | 'folder'
  | 'calendar';

/** A single navigation item. */
export interface NavItem {
  /** Unique identifier. */
  id: string;
  /** Display label. */
  label: string;
  /** Route path. */
  path: string;
  /** Icon name from the icon map. */
  icon: NavIconName;
  /** Roles that can access this item. Empty array means all roles. */
  authorities: UserRole[];
  /** Child navigation items. */
  children?: NavItem[];
}

/** Navigation section grouping related items. */
export interface NavSection {
  /** Section title (optional, used as label if shown). */
  title?: string;
  /** Items in this section. */
  items: NavItem[];
}

/** Complete navigation configuration. */
export interface NavConfig {
  /** Navigation sections. */
  sections: NavSection[];
}
