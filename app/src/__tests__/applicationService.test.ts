/**
 * Tests for application service.
 * Task 1.7: Add tests for form rendering, draft, and submission flows.
 */

// Mock secure storage before any service imports (needed by apiClient)
jest.mock('../utils/secureStorage', () => ({
  getStoredTokens: jest.fn().mockResolvedValue({
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresAt: Date.now() + 3600000,
  }),
  storeTokens: jest.fn().mockResolvedValue(undefined),
  clearStoredTokens: jest.fn().mockResolvedValue(undefined),
  isTokenExpired: jest.fn().mockReturnValue(false),
}));

import {
  getApplications,
  getApplication,
  getApplicationDraft,
  saveApplicationDraft,
  submitApplication,
  ApplicationApiError,
} from '../services/applicationService';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('applicationService', () => {
  const accessToken = 'test-access-token';

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getApplications', () => {
    it('returns applications on success', async () => {
      const applications = [
        { id: 'app-1', title: 'Background Check', status: 'pending' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ applications }),
      });

      const result = await getApplications(accessToken);

      expect(result.applications).toEqual(applications);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/applications'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${accessToken}`,
          }),
        })
      );
    });

    it('throws UNAUTHORIZED error on 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ code: 'UNAUTHORIZED', message: 'Unauthorized' }),
      });

      await expect(getApplications(accessToken)).rejects.toThrow(
        expect.objectContaining({
          code: 'UNAUTHORIZED',
          status: 401,
        })
      );
    });

    it('throws NETWORK_ERROR on TypeError', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(getApplications(accessToken)).rejects.toThrow(
        expect.objectContaining({
          code: 'NETWORK_ERROR',
        })
      );
    });
  });

  describe('getApplication', () => {
    it('returns application details on success', async () => {
      const application = {
        id: 'app-1',
        title: 'Background Check',
        sections: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ application }),
      });

      const result = await getApplication(accessToken, 'app-1');

      expect(result.application).toEqual(application);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/applications/app-1'),
        expect.any(Object)
      );
    });

    it('throws NOT_FOUND error on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ code: 'NOT_FOUND', message: 'Not found' }),
      });

      await expect(getApplication(accessToken, 'app-1')).rejects.toThrow(
        expect.objectContaining({
          code: 'NOT_FOUND',
          status: 404,
        })
      );
    });
  });

  describe('getApplicationDraft', () => {
    it('returns draft on success', async () => {
      const draft = {
        applicationId: 'app-1',
        values: { name: 'John' },
        savedAt: Date.now(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ draft }),
      });

      const result = await getApplicationDraft(accessToken, 'app-1');

      expect(result.draft).toEqual(draft);
    });

    it('returns null draft on 404', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ code: 'NOT_FOUND', message: 'No draft' }),
      });

      const result = await getApplicationDraft(accessToken, 'app-1');

      expect(result.draft).toBeNull();
    });
  });

  describe('saveApplicationDraft', () => {
    it('saves draft and returns success', async () => {
      const savedAt = Date.now();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, savedAt }),
      });

      const result = await saveApplicationDraft(accessToken, 'app-1', {
        values: { name: 'John' },
      });

      expect(result.success).toBe(true);
      expect(result.savedAt).toBe(savedAt);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/applications/app-1/draft'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ values: { name: 'John' } }),
        })
      );
    });
  });

  describe('submitApplication', () => {
    it('submits application and returns confirmation', async () => {
      const submittedAt = '2026-02-03T12:00:00Z';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          submittedAt,
          message: 'Application submitted!',
        }),
      });

      const result = await submitApplication(accessToken, 'app-1', {
        values: { name: 'John' },
      });

      expect(result.success).toBe(true);
      expect(result.submittedAt).toBe(submittedAt);
      expect(result.message).toBe('Application submitted!');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/applications/app-1/submit'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('throws VALIDATION_ERROR on 400', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ code: 'VALIDATION_ERROR', message: 'Validation failed' }),
      });

      await expect(
        submitApplication(accessToken, 'app-1', { values: {} })
      ).rejects.toThrow(
        expect.objectContaining({
          code: 'VALIDATION_ERROR',
          status: 400,
        })
      );
    });
  });

  describe('ApplicationApiError', () => {
    it('creates error with correct properties', () => {
      const error = new ApplicationApiError('TEST_CODE', 'Test message', 400);

      expect(error.name).toBe('ApplicationApiError');
      expect(error.code).toBe('TEST_CODE');
      expect(error.message).toBe('Test message');
      expect(error.status).toBe(400);
    });
  });
});
