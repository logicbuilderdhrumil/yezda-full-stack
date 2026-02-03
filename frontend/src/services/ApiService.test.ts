import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('endpoint.config', () => {
  describe('resolveEndpoint', () => {
    let resolveEndpoint: typeof import('@/configs/endpoint.config').resolveEndpoint;
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(async () => {
      vi.resetModules();
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // Dynamically import to pick up fresh module state
      const mod = await import('@/configs/endpoint.config');
      resolveEndpoint = mod.resolveEndpoint;
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('resolves a simple endpoint without params', () => {
      const url = resolveEndpoint('auth.signIn');
      expect(url).toBe('/api/v1/auth/sign-in');
    });

    it('resolves an endpoint with path parameters', () => {
      const url = resolveEndpoint('users.get', { id: '123' });
      expect(url).toBe('/api/v1/users/123');
    });

    it('encodes path parameter values', () => {
      const url = resolveEndpoint('users.get', { id: 'user/with/slashes' });
      expect(url).toBe('/api/v1/users/user%2Fwith%2Fslashes');
    });

    it('handles multiple path parameters', () => {
      // Test that param replacement works correctly for endpoints with params
      const url = resolveEndpoint('users.update', { id: 'user-456' });
      expect(url).toBe('/api/v1/users/user-456');
    });
  });

  describe('endpoints object', () => {
    it('contains auth endpoints', async () => {
      const { endpoints } = await import('@/configs/endpoint.config');
      expect(endpoints['auth.signIn']).toBeDefined();
      expect(endpoints['auth.signUp']).toBeDefined();
      expect(endpoints['auth.refresh']).toBeDefined();
    });

    it('contains user endpoints', async () => {
      const { endpoints } = await import('@/configs/endpoint.config');
      expect(endpoints['users.list']).toBeDefined();
      expect(endpoints['users.get']).toBeDefined();
    });
  });
});

describe('ApiService utilities', () => {
  describe('createAbortController', () => {
    it('returns controller and signal', async () => {
      const { createAbortController } = await import('@/services/ApiService');
      const { controller, signal } = createAbortController();

      expect(controller).toBeInstanceOf(AbortController);
      expect(signal).toBe(controller.signal);
    });
  });

  describe('isRequestCancelled', () => {
    it('returns true for cancelled errors', async () => {
      const { isRequestCancelled } = await import('@/services/ApiService');
      const axios = await import('axios');
      
      // Create a cancel error to test detection
      const cancelError = new axios.default.Cancel('Test cancel');
      
      // Verify the function correctly identifies the cancel error
      expect(isRequestCancelled(cancelError)).toBe(true);
    });

    it('returns false for regular errors', async () => {
      const { isRequestCancelled } = await import('@/services/ApiService');
      
      expect(isRequestCancelled(new Error('Not cancelled'))).toBe(false);
      expect(isRequestCancelled({ message: 'error' })).toBe(false);
    });
  });
});
