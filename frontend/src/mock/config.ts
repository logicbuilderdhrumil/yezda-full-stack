/**
 * Mock API configuration.
 * Controls whether mock responses are enabled.
 */

/** Mock configuration interface. */
export interface MockConfig {
  /** Enable mock API responses. */
  enabled: boolean;
  /** Simulated network latency in milliseconds. */
  latencyMs: number;
  /** Log mock requests to console. */
  logRequests: boolean;
}

/**
 * Default mock configuration.
 * Reads from environment variable VITE_MOCK_API or defaults to disabled.
 */
const defaultConfig: MockConfig = {
  enabled: import.meta.env.VITE_MOCK_API === 'true',
  latencyMs: 200,
  logRequests: import.meta.env.DEV,
};

let currentConfig: MockConfig = { ...defaultConfig };

/**
 * Gets the current mock configuration.
 * @returns Current mock config
 */
export function getMockConfig(): MockConfig {
  return { ...currentConfig };
}

/**
 * Updates mock configuration.
 * @param updates - Partial config updates
 */
export function setMockConfig(updates: Partial<MockConfig>): void {
  currentConfig = { ...currentConfig, ...updates };
}

/**
 * Resets mock configuration to defaults.
 */
export function resetMockConfig(): void {
  currentConfig = { ...defaultConfig };
}

/**
 * Checks if mock mode is enabled.
 * @returns True if mock API is enabled
 */
export function isMockEnabled(): boolean {
  return currentConfig.enabled;
}
