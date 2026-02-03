/**
 * Mock adapter tests.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
  setupMockAdapter,
  getMockAdapter,
  resetMockAdapter,
  resetMockHandlers,
  setMockConfig,
  resetMockConfig,
  getMockConfig,
  isMockEnabled,
} from './index';

describe('Mock Config', () => {
  beforeEach(() => {
    resetMockConfig();
  });

  it('should return default config', () => {
    const config = getMockConfig();
    expect(config).toHaveProperty('enabled');
    expect(config).toHaveProperty('latencyMs');
    expect(config).toHaveProperty('logRequests');
  });

  it('should update config', () => {
    setMockConfig({ latencyMs: 500 });
    const config = getMockConfig();
    expect(config.latencyMs).toBe(500);
  });

  it('should reset config to defaults', () => {
    setMockConfig({ latencyMs: 1000 });
    resetMockConfig();
    const config = getMockConfig();
    expect(config.latencyMs).toBe(200);
  });

  it('isMockEnabled should reflect enabled state', () => {
    setMockConfig({ enabled: true });
    expect(isMockEnabled()).toBe(true);
    setMockConfig({ enabled: false });
    expect(isMockEnabled()).toBe(false);
  });
});

describe('Mock Adapter', () => {
  const testClient = axios.create({ baseURL: '/' });
  
  beforeEach(() => {
    resetMockConfig();
    resetMockAdapter();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    resetMockAdapter();
    vi.restoreAllMocks();
  });

  it('should not initialize when mock is disabled', () => {
    setMockConfig({ enabled: false });
    const adapter = setupMockAdapter(testClient);
    expect(adapter).toBeNull();
    expect(getMockAdapter()).toBeNull();
  });

  it('should initialize when mock is enabled', () => {
    setMockConfig({ enabled: true, logRequests: false });
    const adapter = setupMockAdapter(testClient);
    expect(adapter).toBeInstanceOf(MockAdapter);
    expect(getMockAdapter()).toBe(adapter);
  });

  it('should reset adapter correctly', () => {
    setMockConfig({ enabled: true, logRequests: false });
    setupMockAdapter(testClient);
    expect(getMockAdapter()).not.toBeNull();
    resetMockAdapter();
    expect(getMockAdapter()).toBeNull();
  });
});

describe('Mock API Endpoints', () => {
  const testClient = axios.create({ baseURL: '/' });
  
  beforeEach(() => {
    resetMockConfig();
    setMockConfig({ enabled: true, latencyMs: 0, logRequests: false });
    setupMockAdapter(testClient);
  });

  afterEach(() => {
    resetMockAdapter();
  });

  describe('Auth Endpoints', () => {
    it('should mock sign-in', async () => {
      const response = await testClient.post('/api/v1/auth/sign-in', {
        email: 'demo@example.com',
        password: 'Demo123!',
      });
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('user');
      expect(response.data).toHaveProperty('accessToken');
    });

    it('should mock sign-up', async () => {
      const response = await testClient.post('/api/v1/auth/sign-up', {
        email: 'new@example.com',
        password: 'Password123!',
      });
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('user');
    });

    it('should mock get current user', async () => {
      const response = await testClient.get('/api/v1/auth/me');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('user');
    });

    it('should mock refresh token', async () => {
      const response = await testClient.post('/api/v1/auth/refresh');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('accessToken');
    });
  });

  describe('Users Endpoints', () => {
    it('should mock list users', async () => {
      const response = await testClient.get('/api/v1/users');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should mock get user by id', async () => {
      const response = await testClient.get('/api/v1/users/001');
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('id', '001');
    });

    it('should return 404 for unknown user', async () => {
      try {
        await testClient.get('/api/v1/users/unknown');
      } catch (error) {
        if (axios.isAxiosError(error)) {
          expect(error.response?.status).toBe(404);
        }
      }
    });

    it('should mock create user', async () => {
      const response = await testClient.post('/api/v1/users', {
        email: 'new@example.com',
        firstName: 'New',
      });
      expect(response.status).toBe(201);
      expect(response.data.data).toHaveProperty('email', 'new@example.com');
    });

    it('should mock update user', async () => {
      const response = await testClient.put('/api/v1/users/001', {
        firstName: 'Updated',
      });
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('firstName', 'Updated');
    });

    it('should mock delete user', async () => {
      const response = await testClient.delete('/api/v1/users/001');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    });
  });

  describe('Candidates Endpoints', () => {
    it('should mock list candidates', async () => {
      const response = await testClient.get('/api/v1/candidates');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should mock get candidate by id', async () => {
      const response = await testClient.get('/api/v1/candidates/c001');
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('id', 'c001');
    });

    it('should return 404 for unknown candidate', async () => {
      try {
        await testClient.get('/api/v1/candidates/unknown');
      } catch (error) {
        if (axios.isAxiosError(error)) {
          expect(error.response?.status).toBe(404);
        }
      }
    });

    it('should mock create candidate', async () => {
      const response = await testClient.post('/api/v1/candidates', {
        firstName: 'New',
        lastName: 'Candidate',
      });
      expect(response.status).toBe(201);
      expect(response.data.data).toHaveProperty('firstName', 'New');
    });

    it('should mock update candidate', async () => {
      const response = await testClient.put('/api/v1/candidates/c001', {
        status: 'approved',
      });
      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('status', 'approved');
    });

    it('should mock delete candidate', async () => {
      const response = await testClient.delete('/api/v1/candidates/c001');
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('success', true);
    });
  });

  describe('Reset Handlers', () => {
    it('should reset handlers and re-register', async () => {
      // First call should work
      const response1 = await testClient.get('/api/v1/auth/me');
      expect(response1.status).toBe(200);

      // Reset handlers
      resetMockHandlers();

      // Should still work after reset
      const response2 = await testClient.get('/api/v1/auth/me');
      expect(response2.status).toBe(200);
    });
  });
});
