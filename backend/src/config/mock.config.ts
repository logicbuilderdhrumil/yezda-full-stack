/**
 * Mock Mode Configuration
 * Controls mock API mode for local development and testing.
 * 
 * SECURITY: Mock mode is strictly prohibited in production environments.
 */

export interface MockConfig {
  /** Whether mock mode is currently enabled */
  enabled: boolean;
  /** Allowed environments for mock mode ("development", "test") */
  allowedEnvironments: string[];
  /** Current environment */
  environment: string;
  /** Debug logging for mock responses */
  debugLogging: boolean;
}

/**
 * Environments where mock mode is allowed
 * Production is explicitly excluded for security
 */
const ALLOWED_MOCK_ENVIRONMENTS = ['development', 'test'];

/**
 * Production environment identifiers that block mock mode
 */
const PRODUCTION_ENVIRONMENTS = ['production', 'prod', 'live'];

function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function getEnvBoolOrDefault(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Validate that mock mode is not being enabled in production
 * @throws Error if attempting to enable mock mode in production
 */
function validateMockModeEnvironment(enabled: boolean, environment: string): void {
  if (!enabled) return;

  const isProduction = PRODUCTION_ENVIRONMENTS.includes(environment.toLowerCase());
  
  if (isProduction) {
    throw new Error(
      `[SECURITY] Mock mode cannot be enabled in production environment: ${environment}. ` +
      'This is a critical security safeguard to prevent mock data from being served to real users.'
    );
  }

  if (!ALLOWED_MOCK_ENVIRONMENTS.includes(environment.toLowerCase())) {
    console.warn(
      `[SECURITY WARNING] Mock mode enabled in unrecognized environment: ${environment}. ` +
      `Allowed environments: ${ALLOWED_MOCK_ENVIRONMENTS.join(', ')}`
    );
  }
}

const environment = getEnvOrDefault('NODE_ENV', 'development');
const mockEnabled = getEnvBoolOrDefault('MOCK_API_ENABLED', false);

// Validate at module load time - fail fast if misconfigured
validateMockModeEnvironment(mockEnabled, environment);

export const mockConfig: MockConfig = {
  enabled: mockEnabled,
  allowedEnvironments: ALLOWED_MOCK_ENVIRONMENTS,
  environment,
  debugLogging: getEnvBoolOrDefault('MOCK_API_DEBUG', false),
};

/**
 * Check if mock mode is currently enabled
 * Safe to call at any time - returns false if environment is not allowed
 */
export function isMockModeEnabled(): boolean {
  const currentEnv = process.env.NODE_ENV || 'development';
  const isProduction = PRODUCTION_ENVIRONMENTS.includes(currentEnv.toLowerCase());
  
  // Never allow in production, even if flag is set
  if (isProduction) {
    return false;
  }
  
  return mockConfig.enabled;
}

/**
 * Check if the current environment allows mock mode
 */
export function canEnableMockMode(): boolean {
  const currentEnv = process.env.NODE_ENV || 'development';
  return ALLOWED_MOCK_ENVIRONMENTS.includes(currentEnv.toLowerCase());
}

/**
 * Get the reason why mock mode cannot be enabled (if applicable)
 */
export function getMockModeBlockedReason(): string | null {
  const currentEnv = process.env.NODE_ENV || 'development';
  
  if (PRODUCTION_ENVIRONMENTS.includes(currentEnv.toLowerCase())) {
    return `Mock mode is blocked in production environment: ${currentEnv}`;
  }
  
  if (!ALLOWED_MOCK_ENVIRONMENTS.includes(currentEnv.toLowerCase())) {
    return `Mock mode is not allowed in environment: ${currentEnv}. Allowed: ${ALLOWED_MOCK_ENVIRONMENTS.join(', ')}`;
  }
  
  return null;
}

export default mockConfig;
