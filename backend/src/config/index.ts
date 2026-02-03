/**
 * Configuration Module
 * Centralized configuration for auth services
 */

export interface AuthConfig {
  jwt: {
    accessTokenSecret: string;
    refreshTokenSecret: string;
    accessTokenTtlSeconds: number;
    refreshTokenTtlSeconds: number;
    issuer: string;
    audience: string;
  };
  security: {
    maxFailedAttempts: number;
    lockoutDurationMinutes: number;
    passwordResetTtlMinutes: number;
    mfaIssuer: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    maxAuthRequests: number;
  };
}

function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function getEnvIntOrDefault(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export const config: AuthConfig = {
  jwt: {
    accessTokenSecret: getEnvOrDefault('JWT_ACCESS_SECRET', 'dev-access-secret-change-in-production'),
    refreshTokenSecret: getEnvOrDefault('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production'),
    accessTokenTtlSeconds: getEnvIntOrDefault('JWT_ACCESS_TTL_SECONDS', 900), // 15 minutes
    refreshTokenTtlSeconds: getEnvIntOrDefault('JWT_REFRESH_TTL_SECONDS', 604800), // 7 days
    issuer: getEnvOrDefault('JWT_ISSUER', 'yezda-auth'),
    audience: getEnvOrDefault('JWT_AUDIENCE', 'yezda-api'),
  },
  security: {
    maxFailedAttempts: getEnvIntOrDefault('AUTH_MAX_FAILED_ATTEMPTS', 5),
    lockoutDurationMinutes: getEnvIntOrDefault('AUTH_LOCKOUT_DURATION_MINUTES', 30),
    passwordResetTtlMinutes: getEnvIntOrDefault('AUTH_PASSWORD_RESET_TTL_MINUTES', 60),
    mfaIssuer: getEnvOrDefault('MFA_ISSUER', 'Yezda'),
  },
  rateLimit: {
    windowMs: getEnvIntOrDefault('RATE_LIMIT_WINDOW_MS', 60000), // 1 minute
    maxRequests: getEnvIntOrDefault('RATE_LIMIT_MAX_REQUESTS', 100),
    maxAuthRequests: getEnvIntOrDefault('RATE_LIMIT_MAX_AUTH_REQUESTS', 10),
  },
};

export default config;
