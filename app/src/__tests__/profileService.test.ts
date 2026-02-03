/**
 * Tests for profile service API calls.
 * Task 1.7: Add tests for profile view, edit, and validation flows.
 */

import { getProfile, updateProfile, ProfileApiError } from '../services/profileService';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('profileService', () => {
  const mockAccessToken = 'test-access-token';

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('getProfile', () => {
    const mockProfile = {
      id: '1',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('returns profile on successful request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ profile: mockProfile }),
      });

      const result = await getProfile(mockAccessToken);

      expect(result).toEqual(mockProfile);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/profile'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
          }),
        })
      );
    });

    it('throws ProfileApiError on 401 unauthorized', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ code: 'UNAUTHORIZED', message: 'Unauthorized' }),
      });

      await expect(getProfile(mockAccessToken)).rejects.toThrow(ProfileApiError);
      await expect(getProfile(mockAccessToken)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        status: 401,
      });
    });

    it('throws ProfileApiError on network error', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(getProfile(mockAccessToken)).rejects.toThrow(ProfileApiError);
      await expect(getProfile(mockAccessToken)).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
      });
    });

    it('throws ProfileApiError on timeout', async () => {
      // Create an abort error
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValue(abortError);

      await expect(getProfile(mockAccessToken)).rejects.toThrow(ProfileApiError);
      await expect(getProfile(mockAccessToken)).rejects.toMatchObject({
        code: 'REQUEST_TIMEOUT',
      });
    });
  });

  describe('updateProfile', () => {
    const mockUpdateData = {
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '555-9999',
    };

    const mockUpdatedProfile = {
      id: '1',
      email: 'john@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '555-9999',
    };

    it('returns updated profile on successful request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ profile: mockUpdatedProfile }),
      });

      const result = await updateProfile(mockAccessToken, mockUpdateData);

      expect(result).toEqual(mockUpdatedProfile);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/profile'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockAccessToken}`,
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(mockUpdateData),
        })
      );
    });

    it('throws ProfileApiError on 401 unauthorized', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ code: 'UNAUTHORIZED', message: 'Unauthorized' }),
      });

      await expect(updateProfile(mockAccessToken, mockUpdateData)).rejects.toThrow(
        ProfileApiError
      );
      await expect(updateProfile(mockAccessToken, mockUpdateData)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        status: 401,
      });
    });

    it('throws ProfileApiError on 400 validation error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ code: 'VALIDATION_ERROR', message: 'Invalid data' }),
      });

      await expect(updateProfile(mockAccessToken, mockUpdateData)).rejects.toThrow(
        ProfileApiError
      );
      await expect(updateProfile(mockAccessToken, mockUpdateData)).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        status: 400,
      });
    });

    it('throws ProfileApiError on network error', async () => {
      mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(updateProfile(mockAccessToken, mockUpdateData)).rejects.toThrow(
        ProfileApiError
      );
      await expect(updateProfile(mockAccessToken, mockUpdateData)).rejects.toMatchObject({
        code: 'NETWORK_ERROR',
      });
    });
  });
});
