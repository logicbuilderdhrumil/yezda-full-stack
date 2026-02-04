/**
 * Foundation API Contract Map
 * Lists all foundation API endpoints with their contracts.
 *
 * @see openspec/changes/integration-frontend-backend-foundations/specs/frontend-backend-integration/spec.md
 */

import type {
  SignUpRequest,
  SignUpResponse,
  SignInRequest,
  SignInResponse,
  MfaVerifyRequest,
  TokenRefreshRequest,
  TokenRefreshResponse,
  PasswordResetRequest,
  PasswordResetCompleteRequest,
  CurrentUserResponse,
  MfaEnrollmentResponse,
  MfaEnrollmentCompleteRequest,
  MfaEnrollmentCompleteResponse,
  TokenPair,
} from './auth';
import type { ApiErrorEnvelope } from './error-envelope';
import type {
  NotificationListRequest,
  NotificationListResponse,
  UnreadCountResponse,
  MarkAsReadRequest,
  MarkAsReadResponse,
  Notification,
} from './notifications';

/**
 * HTTP method type.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * API endpoint contract definition.
 */
export interface ApiContract<TRequest = unknown, TResponse = unknown> {
  /** HTTP method */
  method: HttpMethod;
  /** Path relative to /api/v1 */
  path: string;
  /** Description of what this endpoint does */
  description: string;
  /** Whether authentication is required */
  auth: boolean;
  /** Request body type (for documentation) */
  request?: string;
  /** Response body type (for documentation) */
  response?: string;
  /** Error response type */
  error: 'ApiErrorEnvelope';
}

/**
 * Foundation API contract map.
 * This serves as the source of truth for API contracts.
 */
export const FOUNDATION_API_CONTRACTS = {
  // ============================================================================
  // Authentication Endpoints
  // ============================================================================
  'auth.signUp': {
    method: 'POST',
    path: '/auth/sign-up',
    description: 'Create a new user or candidate account',
    auth: false,
    request: 'SignUpRequest',
    response: 'SignUpResponse',
    error: 'ApiErrorEnvelope',
  },
  'auth.signIn': {
    method: 'POST',
    path: '/auth/sign-in',
    description: 'Sign in with email and password',
    auth: false,
    request: 'SignInRequest',
    response: 'SignInResponse',
    error: 'ApiErrorEnvelope',
  },
  'auth.mfaVerify': {
    method: 'POST',
    path: '/auth/mfa/verify',
    description: 'Complete MFA verification for sign-in',
    auth: false,
    request: 'MfaVerifyRequest',
    response: 'TokenPair',
    error: 'ApiErrorEnvelope',
  },
  'auth.refresh': {
    method: 'POST',
    path: '/auth/refresh',
    description: 'Refresh access token using refresh token',
    auth: false,
    request: 'TokenRefreshRequest',
    response: 'TokenRefreshResponse',
    error: 'ApiErrorEnvelope',
  },
  'auth.signOut': {
    method: 'POST',
    path: '/auth/sign-out',
    description: 'Sign out the current session',
    auth: true,
    response: '{ message: string }',
    error: 'ApiErrorEnvelope',
  },
  'auth.me': {
    method: 'GET',
    path: '/auth/me',
    description: 'Get current authenticated user',
    auth: true,
    response: 'CurrentUserResponse',
    error: 'ApiErrorEnvelope',
  },
  'auth.passwordResetRequest': {
    method: 'POST',
    path: '/auth/password/reset-request',
    description: 'Request a password reset',
    auth: false,
    request: 'PasswordResetRequest',
    response: '{ message: string }',
    error: 'ApiErrorEnvelope',
  },
  'auth.passwordResetComplete': {
    method: 'POST',
    path: '/auth/password/reset-complete',
    description: 'Complete password reset with token',
    auth: false,
    request: 'PasswordResetCompleteRequest',
    response: '{ message: string }',
    error: 'ApiErrorEnvelope',
  },
  'auth.mfaEnroll': {
    method: 'POST',
    path: '/auth/mfa/enroll',
    description: 'Start MFA enrollment',
    auth: true,
    response: 'MfaEnrollmentResponse',
    error: 'ApiErrorEnvelope',
  },
  'auth.mfaEnrollVerify': {
    method: 'POST',
    path: '/auth/mfa/enroll/verify',
    description: 'Complete MFA enrollment',
    auth: true,
    request: 'MfaEnrollmentCompleteRequest',
    response: 'MfaEnrollmentCompleteResponse',
    error: 'ApiErrorEnvelope',
  },
  'auth.mfaDisable': {
    method: 'DELETE',
    path: '/auth/mfa',
    description: 'Disable MFA for user',
    auth: true,
    response: '{ message: string }',
    error: 'ApiErrorEnvelope',
  },

  // ============================================================================
  // Notification Endpoints
  // ============================================================================
  'notifications.list': {
    method: 'GET',
    path: '/notifications',
    description: 'List notifications for current user',
    auth: true,
    request: 'NotificationListRequest (query params)',
    response: 'NotificationListResponse',
    error: 'ApiErrorEnvelope',
  },
  'notifications.get': {
    method: 'GET',
    path: '/notifications/:id',
    description: 'Get a single notification',
    auth: true,
    response: 'Notification',
    error: 'ApiErrorEnvelope',
  },
  'notifications.unreadCount': {
    method: 'GET',
    path: '/notifications/unread-count',
    description: 'Get unread notification count',
    auth: true,
    response: 'UnreadCountResponse',
    error: 'ApiErrorEnvelope',
  },
  'notifications.markAsRead': {
    method: 'PATCH',
    path: '/notifications/:id/read',
    description: 'Mark a notification as read',
    auth: true,
    response: 'Notification',
    error: 'ApiErrorEnvelope',
  },
  'notifications.markAsUnread': {
    method: 'PATCH',
    path: '/notifications/:id/unread',
    description: 'Mark a notification as unread',
    auth: true,
    response: 'Notification',
    error: 'ApiErrorEnvelope',
  },
  'notifications.markManyAsRead': {
    method: 'POST',
    path: '/notifications/mark-read',
    description: 'Mark multiple notifications as read',
    auth: true,
    request: 'MarkAsReadRequest',
    response: 'MarkAsReadResponse',
    error: 'ApiErrorEnvelope',
  },

  // ============================================================================
  // State Store Endpoints
  // ============================================================================
  'state.get': {
    method: 'GET',
    path: '/state/:namespace/:key',
    description: 'Get a state value',
    auth: true,
    response: '{ value: unknown }',
    error: 'ApiErrorEnvelope',
  },
  'state.set': {
    method: 'PUT',
    path: '/state/:namespace/:key',
    description: 'Set a state value',
    auth: true,
    request: '{ value: unknown }',
    response: '{ success: boolean }',
    error: 'ApiErrorEnvelope',
  },
  'state.delete': {
    method: 'DELETE',
    path: '/state/:namespace/:key',
    description: 'Delete a state value',
    auth: true,
    response: '{ success: boolean }',
    error: 'ApiErrorEnvelope',
  },
  'state.list': {
    method: 'GET',
    path: '/state/:namespace',
    description: 'List keys in a namespace',
    auth: true,
    response: '{ keys: string[] }',
    error: 'ApiErrorEnvelope',
  },

  // ============================================================================
  // Theme Endpoints
  // ============================================================================
  'theme.get': {
    method: 'GET',
    path: '/theme',
    description: 'Get current theme settings',
    auth: true,
    response: 'ThemeConfig',
    error: 'ApiErrorEnvelope',
  },
  'theme.update': {
    method: 'PUT',
    path: '/theme',
    description: 'Update theme settings',
    auth: true,
    request: 'ThemeConfig',
    response: 'ThemeConfig',
    error: 'ApiErrorEnvelope',
  },

  // ============================================================================
  // Localization Endpoints
  // ============================================================================
  'localization.getLocale': {
    method: 'GET',
    path: '/localization/locale',
    description: 'Get current locale settings',
    auth: true,
    response: 'LocaleConfig',
    error: 'ApiErrorEnvelope',
  },
  'localization.setLocale': {
    method: 'PUT',
    path: '/localization/locale',
    description: 'Update locale settings',
    auth: true,
    request: '{ locale: string }',
    response: 'LocaleConfig',
    error: 'ApiErrorEnvelope',
  },
  'localization.getTranslations': {
    method: 'GET',
    path: '/localization/translations/:locale',
    description: 'Get translations for a locale',
    auth: false,
    response: 'Record<string, string>',
    error: 'ApiErrorEnvelope',
  },

  // ============================================================================
  // OAuth Endpoints
  // ============================================================================
  'oauth.providers': {
    method: 'GET',
    path: '/oauth/providers',
    description: 'List available OAuth providers',
    auth: false,
    response: 'OAuthProvider[]',
    error: 'ApiErrorEnvelope',
  },
  'oauth.authorize': {
    method: 'GET',
    path: '/oauth/:provider/authorize',
    description: 'Start OAuth authorization flow',
    auth: false,
    response: '{ redirectUrl: string }',
    error: 'ApiErrorEnvelope',
  },
  'oauth.callback': {
    method: 'POST',
    path: '/oauth/:provider/callback',
    description: 'Complete OAuth authorization',
    auth: false,
    request: '{ code: string; state: string }',
    response: 'TokenPair',
    error: 'ApiErrorEnvelope',
  },
  'oauth.link': {
    method: 'POST',
    path: '/oauth/:provider/link',
    description: 'Link OAuth provider to existing account',
    auth: true,
    request: '{ code: string }',
    response: '{ success: boolean }',
    error: 'ApiErrorEnvelope',
  },
  'oauth.unlink': {
    method: 'DELETE',
    path: '/oauth/:provider',
    description: 'Unlink OAuth provider from account',
    auth: true,
    response: '{ success: boolean }',
    error: 'ApiErrorEnvelope',
  },

  // ============================================================================
  // Shell Endpoints
  // ============================================================================
  'shell.config': {
    method: 'GET',
    path: '/shell/config',
    description: 'Get shell configuration for current user',
    auth: true,
    response: 'ShellConfig',
    error: 'ApiErrorEnvelope',
  },
  'shell.navigation': {
    method: 'GET',
    path: '/shell/navigation',
    description: 'Get navigation menu for current user',
    auth: true,
    response: 'NavigationConfig',
    error: 'ApiErrorEnvelope',
  },
} as const satisfies Record<string, ApiContract>;

/**
 * Endpoint names derived from the contract map.
 */
export type FoundationEndpoint = keyof typeof FOUNDATION_API_CONTRACTS;

/**
 * Get the contract for a specific endpoint.
 */
export function getContract(endpoint: FoundationEndpoint): ApiContract {
  return FOUNDATION_API_CONTRACTS[endpoint];
}

/**
 * Get the full path for an endpoint.
 */
export function getEndpointPath(endpoint: FoundationEndpoint): string {
  return `/api/v1${FOUNDATION_API_CONTRACTS[endpoint].path}`;
}
