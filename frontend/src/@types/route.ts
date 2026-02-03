/**
 * Route configuration types for route guards.
 */

import type { UserRole } from './auth';

/** Route meta configuration for guards and layouts. */
export interface RouteMeta {
  /** Page title for document title updates. */
  title?: string;
  /** Layout key to apply to the route. */
  layout?: 'default' | 'auth' | 'blank';
  /** Required authority roles to access the route. */
  authority?: UserRole[];
  /** Whether the route is public (no auth required). */
  isPublic?: boolean;
}

/** Extended route configuration with meta. */
export interface AppRouteConfig {
  /** Route path pattern. */
  path: string;
  /** Component to render. */
  element: React.ReactNode;
  /** Route metadata for guards and layouts. */
  meta?: RouteMeta;
  /** Nested child routes. */
  children?: AppRouteConfig[];
}
