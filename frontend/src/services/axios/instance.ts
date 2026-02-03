import axios, { type AxiosInstance, type CreateAxiosDefaults } from 'axios';

/**
 * Default Axios configuration.
 */
const defaultConfig: CreateAxiosDefaults = {
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
};

/**
 * Creates a configured Axios instance.
 * @param config Optional configuration overrides
 * @returns Configured Axios instance
 */
export function createAxiosInstance(config?: CreateAxiosDefaults): AxiosInstance {
  return axios.create({
    ...defaultConfig,
    ...config,
    headers: {
      ...defaultConfig.headers,
      ...config?.headers,
    },
  });
}

/**
 * The default shared Axios instance for API calls.
 */
export const apiClient = createAxiosInstance();
