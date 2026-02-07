/**
 * Configuration Module
 * Centralized configuration for auth services
 */

export interface OAuthProviderEnv {
  clientId: string;
  clientSecret: string;
}

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
    mfaEncryptionKey: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
    maxAuthRequests: number;
    maxOAuthRequests: number;
  };
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    maxConnections: number;
  };
  redis: {
    host: string;
    port: number;
    password: string;
    db: number;
  };
  oauth: {
    stateExpiryMinutes: number;
    tokenEncryptionKey: string;
    baseRedirectUri: string;
    providers: {
      google?: OAuthProviderEnv;
      microsoft?: OAuthProviderEnv;
      slack?: OAuthProviderEnv;
      github?: OAuthProviderEnv;
    };
  };
}

/**
 * Minimum required length for JWT secrets (256 bits = 32 characters)
 * Using shorter secrets weakens token security significantly.
 */
const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Known weak/default secrets that must be rejected in production
 */
const WEAK_SECRETS = [
  'dev-access-secret-change-in-production',
  'dev-refresh-secret-change-in-production',
  'dev-mfa-encryption-key-change-in-production',
  'secret',
  'password',
  'changeme',
];

function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function getEnvIntOrDefault(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Validate JWT secret strength at startup
 * Fails fast in production if secret is weak or too short
 */
function validateJwtSecret(secret: string, name: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (secret.length < MIN_JWT_SECRET_LENGTH) {
    const message = `${name} is too short (${secret.length} chars). Minimum ${MIN_JWT_SECRET_LENGTH} characters required for security.`;
    if (isProduction) {
      throw new Error(message);
    }
    console.warn(`[SECURITY WARNING] ${message}`);
  }
  
  if (WEAK_SECRETS.includes(secret.toLowerCase())) {
    const message = `${name} appears to be a default or weak value. Use a cryptographically strong random secret.`;
    if (isProduction) {
      throw new Error(message);
    }
    console.warn(`[SECURITY WARNING] ${message}`);
  }
}

const accessTokenSecret = getEnvOrDefault('JWT_ACCESS_SECRET', 'dev-access-secret-change-in-production');
const refreshTokenSecret = getEnvOrDefault('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-in-production');

const mfaEncryptionKey = getEnvOrDefault('MFA_ENCRYPTION_KEY', 'dev-mfa-encryption-key-change-in-production');

// Validate secrets at module load
validateJwtSecret(accessTokenSecret, 'JWT_ACCESS_SECRET');
validateJwtSecret(refreshTokenSecret, 'JWT_REFRESH_SECRET');
validateJwtSecret(mfaEncryptionKey, 'MFA_ENCRYPTION_KEY');

const oauthTokenEncryptionKey = getEnvOrDefault('OAUTH_TOKEN_ENCRYPTION_KEY', 'dev-oauth-encryption-key-change-in-production');
validateJwtSecret(oauthTokenEncryptionKey, 'OAUTH_TOKEN_ENCRYPTION_KEY');

// Load OAuth provider credentials from environment
function loadOAuthProvider(prefix: string): OAuthProviderEnv | undefined {
  const clientId = process.env[`${prefix}_CLIENT_ID`];
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`];
  if (clientId && clientSecret) {
    return { clientId, clientSecret };
  }
  return undefined;
}

export const config: AuthConfig = {
  jwt: {
    accessTokenSecret,
    refreshTokenSecret,
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
    mfaEncryptionKey,
  },
  rateLimit: {
    windowMs: getEnvIntOrDefault('RATE_LIMIT_WINDOW_MS', 60000), // 1 minute
    maxRequests: getEnvIntOrDefault('RATE_LIMIT_MAX_REQUESTS', 100),
    maxAuthRequests: getEnvIntOrDefault('RATE_LIMIT_MAX_AUTH_REQUESTS', 10),
    maxOAuthRequests: getEnvIntOrDefault('RATE_LIMIT_MAX_OAUTH_REQUESTS', 20),
  },
  database: {
    host: getEnvOrDefault('DB_HOST', 'localhost'),
    port: getEnvIntOrDefault('DB_PORT', 6310),
    name: getEnvOrDefault('DB_NAME', 'yezda'),
    user: getEnvOrDefault('DB_USER', 'postgres'),
    password: getEnvOrDefault('DB_PASSWORD', ''),
    maxConnections: getEnvIntOrDefault('DB_MAX_CONNECTIONS', 20),
  },
  redis: {
    host: getEnvOrDefault('REDIS_HOST', 'localhost'),
    port: getEnvIntOrDefault('REDIS_PORT', 6311),
    password: getEnvOrDefault('REDIS_PASSWORD', ''),
    db: getEnvIntOrDefault('REDIS_DB', 0),
  },
  oauth: {
    stateExpiryMinutes: getEnvIntOrDefault('OAUTH_STATE_EXPIRY_MINUTES', 10),
    tokenEncryptionKey: oauthTokenEncryptionKey,
    baseRedirectUri: getEnvOrDefault('OAUTH_BASE_REDIRECT_URI', 'http://localhost:6312/api/v1/oauth/callback'),
    providers: {
      google: loadOAuthProvider('OAUTH_GOOGLE'),
      microsoft: loadOAuthProvider('OAUTH_MICROSOFT'),
      slack: loadOAuthProvider('OAUTH_SLACK'),
      github: loadOAuthProvider('OAUTH_GITHUB'),
    },
  },
};

export default config;
