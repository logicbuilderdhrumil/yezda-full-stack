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
  'auth.forgotPassword': { path: '/auth/forgot-password', version: 'v1' },
  'auth.resetPassword': { path: '/auth/reset-password', version: 'v1' },
  'auth.candidateResetPassword': { path: '/auth/candidate-reset-password', version: 'v1' },
  'auth.verifyTotp': { path: '/auth/verify-totp', version: 'v1' },
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

  return `/api/${version}${path}`;
}
