/**
 * API endpoint configuration map.
 * Provides a centralized place to define all API endpoints.
 */

/** Available API versions. */
export type ApiVersion = 'v1';

/** API endpoint definition. */
export interface EndpointConfig {
  path: string;
  version?: ApiVersion;
}

/**
 * Endpoint configuration map keyed by logical name.
 */
export const endpoints = {
  // Auth endpoints
  'auth.signIn': { path: '/auth/sign-in', version: 'v1' },
  'auth.signUp': { path: '/auth/sign-up', version: 'v1' },
  'auth.signOut': { path: '/auth/sign-out', version: 'v1' },
  'auth.passwordResetRequest': { path: '/auth/password/reset-request', version: 'v1' },
  'auth.passwordResetComplete': { path: '/auth/password/reset-complete', version: 'v1' },
  'auth.candidateResetPassword': { path: '/auth/candidate-reset-password', version: 'v1' },
  'auth.mfaVerify': { path: '/auth/mfa/verify', version: 'v1' },
  'auth.refresh': { path: '/auth/refresh', version: 'v1' },
  'auth.me': { path: '/auth/me', version: 'v1' },

  // User endpoints
  'users.list': { path: '/users', version: 'v1' },
  'users.get': { path: '/users/:id', version: 'v1' },
  'users.create': { path: '/users', version: 'v1' },
  'users.update': { path: '/users/:id', version: 'v1' },
  'users.delete': { path: '/users/:id', version: 'v1' },

  // Candidates endpoints
  'candidates.list': { path: '/candidates', version: 'v1' },
  'candidates.get': { path: '/candidates/:id', version: 'v1' },
  'candidates.create': { path: '/candidates', version: 'v1' },
  'candidates.update': { path: '/candidates/:id', version: 'v1' },
  'candidates.delete': { path: '/candidates/:id', version: 'v1' },
  'candidates.bulkCreate': { path: '/candidates/bulk', version: 'v1' },

  // Organizations endpoints
  'organizations.list': { path: '/organizations', version: 'v1' },
  'organizations.get': { path: '/organizations/:id', version: 'v1' },
  'organizations.create': { path: '/organizations', version: 'v1' },
  'organizations.update': { path: '/organizations/:id', version: 'v1' },
  'organizations.delete': { path: '/organizations/:id', version: 'v1' },

  // Notification endpoints
  'notifications.list': { path: '/notifications', version: 'v1' },
  'notifications.get': { path: '/notifications/:id', version: 'v1' },
  'notifications.unreadCount': { path: '/notifications/unread-count', version: 'v1' },
  'notifications.markAsRead': { path: '/notifications/:id/read', version: 'v1' },
  'notifications.markAsUnread': { path: '/notifications/:id/unread', version: 'v1' },
  'notifications.markManyAsRead': { path: '/notifications/mark-read', version: 'v1' },

  // File management endpoints
  'files.upload': { path: '/files/upload', version: 'v1' },
  'files.list': { path: '/files', version: 'v1' },
  'files.get': { path: '/files/:id', version: 'v1' },
  'files.download': { path: '/files/:id/download', version: 'v1' },
  'files.delete': { path: '/files/:id', version: 'v1' },
  'files.storageUsage': { path: '/files/storage-usage', version: 'v1' },
  'files.signedUrl': { path: '/files/signed-url', version: 'v1' },

  // Asset management endpoints
  'assets.upload': { path: '/assets/upload', version: 'v1' },
  'assets.list': { path: '/assets', version: 'v1' },
  'assets.get': { path: '/assets/:id', version: 'v1' },
  'assets.update': { path: '/assets/:id', version: 'v1' },
  'assets.delete': { path: '/assets/:id', version: 'v1' },
  'assets.tags': { path: '/assets/:id/tags', version: 'v1' },

  // Forms endpoints
  'forms.list': { path: '/forms', version: 'v1' },
  'forms.get': { path: '/forms/:id', version: 'v1' },
  'forms.create': { path: '/forms', version: 'v1' },
  'forms.update': { path: '/forms/:id', version: 'v1' },
  'forms.delete': { path: '/forms/:id', version: 'v1' },
  'forms.publish': { path: '/forms/:id/publish', version: 'v1' },
  'forms.submissions': { path: '/forms/:id/submissions', version: 'v1' },

  // Chat endpoints
  'chat.conversations': { path: '/chat/conversations', version: 'v1' },
  'chat.conversation': { path: '/chat/conversations/:id', version: 'v1' },
  'chat.messages': { path: '/chat/conversations/:id/messages', version: 'v1' },
  'chat.send': { path: '/chat/conversations/:id/messages', version: 'v1' },
  'chat.markRead': { path: '/chat/conversations/:id/read', version: 'v1' },

  // Charting endpoints
  'charts.data': { path: '/charts/:chartType', version: 'v1' },
  'charts.export': { path: '/charts/:chartType/export', version: 'v1' },
  'charts.saved': { path: '/charts/saved', version: 'v1' },
  'charts.save': { path: '/charts/saved', version: 'v1' },
  'charts.delete': { path: '/charts/saved/:id', version: 'v1' },

  // Billing ledger endpoints
  'billing.billedEntries': { path: '/organizations/:organizationId/ledger/billed', version: 'v1' },
  'billing.unbilledEntries': { path: '/organizations/:organizationId/ledger/unbilled', version: 'v1' },
  'billing.createEntry': { path: '/organizations/:organizationId/ledger/entries', version: 'v1' },
  'billing.updateEntry': { path: '/organizations/:organizationId/ledger/entries/:entryId', version: 'v1' },
  'billing.finalizeEntry': { path: '/organizations/:organizationId/ledger/entries/:entryId/finalize', version: 'v1' },

  // Home dashboard endpoints
  'dashboard.summary': { path: '/dashboard/summary', version: 'v1' },
  'dashboard.widgets': { path: '/dashboard/widgets', version: 'v1' },
  'dashboard.activity': { path: '/dashboard/activity', version: 'v1' },

  // Shared widgets endpoints
  'widgets.list': { path: '/widgets', version: 'v1' },
  'widgets.get': { path: '/widgets/:id', version: 'v1' },
  'widgets.create': { path: '/widgets', version: 'v1' },
  'widgets.update': { path: '/widgets/:id', version: 'v1' },
  'widgets.delete': { path: '/widgets/:id', version: 'v1' },

  // Template layouts endpoints
  'templates.list': { path: '/templates', version: 'v1' },
  'templates.get': { path: '/templates/:id', version: 'v1' },
  'templates.create': { path: '/templates', version: 'v1' },
  'templates.update': { path: '/templates/:id', version: 'v1' },
  'templates.delete': { path: '/templates/:id', version: 'v1' },

  // View components endpoints
  'views.list': { path: '/views', version: 'v1' },
  'views.get': { path: '/views/:id', version: 'v1' },
  'views.create': { path: '/views', version: 'v1' },
  'views.update': { path: '/views/:id', version: 'v1' },
  'views.delete': { path: '/views/:id', version: 'v1' },

  // Jobs and async operations endpoints
  'jobs.status': { path: '/jobs/:jobId', version: 'v1' },
  'jobs.cancel': { path: '/jobs/:jobId/cancel', version: 'v1' },
  'jobs.list': { path: '/jobs', version: 'v1' },

  // Export endpoints
  'exports.request': { path: '/exports', version: 'v1' },
  'exports.status': { path: '/exports/:exportId', version: 'v1' },
  'exports.download': { path: '/exports/:exportId/download', version: 'v1' },
  // Ledger endpoints
  'ledger.list': { path: '/ledger', version: 'v1' },
  'ledger.export': { path: '/ledger/export', version: 'v1' },

  // Dashboard endpoints
  'dashboard.metrics': { path: '/dashboard/metrics', version: 'v1' },
} as const satisfies Record<string, EndpointConfig>;

/** Endpoint names derived from the configuration. */
export type EndpointName = keyof typeof endpoints;

/**
 * Resolves an endpoint path by name, optionally substituting path parameters.
 * @param name - The logical endpoint name
 * @param params - Optional path parameters to substitute (e.g., { id: '123' })
 * @returns The resolved URL path
 */
export function resolveEndpoint(
  name: EndpointName,
  params?: Record<string, string>
): string {
  const config = endpoints[name];
  const version = config.version ?? 'v1';
  let path: string = config.path;

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, encodeURIComponent(value));
    }
  }

  // Warn about unreplaced path parameters in development
  if (path.includes(':') && import.meta.env.DEV) {
    console.warn(`[endpoint.config] Unreplaced path parameters in endpoint "${name}": ${path}`);
  }

  return `/api/${version}${path}`;
}
