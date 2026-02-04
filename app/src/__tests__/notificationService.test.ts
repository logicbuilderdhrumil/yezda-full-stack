/**
 * Unit tests for notification service.
 * Integration: Tests aligned with backend firebase.routes.ts contracts.
 */

import { NotificationApiError } from '../services/notificationService';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock Platform
jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

// Import after mocking
import {
  registerDeviceToken,
  unregisterDeviceToken,
  unregisterAllDeviceTokens,
  getActiveDeviceTokens,
  notificationErrorMessages,
} from '../services/notificationService';

describe('NotificationApiError', () => {
  it('creates error with code, message, and status', () => {
    const error = new NotificationApiError('INVALID_TOKEN_FORMAT', 'Invalid token', 400);

    expect(error.code).toBe('INVALID_TOKEN_FORMAT');
    expect(error.message).toBe('Invalid token');
    expect(error.status).toBe(400);
    expect(error.name).toBe('NotificationApiError');
  });
});

describe('registerDeviceToken', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('registers token successfully', async () => {
    const mockResponse = {
      message: 'Device token registered successfully',
      tokenId: 'token-123',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await registerDeviceToken(
      'access-token',
      'a'.repeat(150), // Valid token length
      { deviceId: 'device-1', appVersion: '1.0.0' }
    );

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/firebase/tokens'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
          'x-channel': 'mobile',
        }),
      })
    );

    // Verify payload has platform from mock
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.platform).toBe('ios');
    expect(callBody.deviceId).toBe('device-1');
  });

  it('includes tenant ID header when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'OK', tokenId: 'token-1' }),
    });

    await registerDeviceToken(
      'access-token',
      'a'.repeat(150),
      { tenantId: 'tenant-abc' }
    );

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-tenant-id': 'tenant-abc',
        }),
      })
    );
  });

  it('throws NotificationApiError for invalid token format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ code: 'INVALID_TOKEN_FORMAT', error: 'Invalid format' }),
    });

    await expect(
      registerDeviceToken('access-token', 'a'.repeat(150))
    ).rejects.toMatchObject({
      code: 'INVALID_TOKEN_FORMAT',
      message: notificationErrorMessages.invalidTokenFormat,
    });
  });

  it('throws NotificationApiError for cross-tenant registration', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: () => Promise.resolve({ code: 'CROSS_TENANT_REGISTRATION', error: 'Denied' }),
    });

    await expect(
      registerDeviceToken('access-token', 'a'.repeat(150))
    ).rejects.toMatchObject({
      code: 'CROSS_TENANT_REGISTRATION',
      status: 403,
    });
  });

  it('throws NotificationApiError for unauthorized', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ code: 'UNAUTHORIZED', error: 'Unauthorized' }),
    });

    await expect(
      registerDeviceToken('invalid-token', 'a'.repeat(150))
    ).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
    });
  });

  it('throws NotificationApiError for network errors', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(
      registerDeviceToken('access-token', 'a'.repeat(150))
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });
});

describe('unregisterDeviceToken', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('unregisters token successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'Device token unregistered successfully' }),
    });

    await expect(
      unregisterDeviceToken('access-token', 'a'.repeat(150))
    ).resolves.toBeUndefined();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/firebase/tokens'),
      expect.objectContaining({
        method: 'DELETE',
      })
    );
  });

  it('throws NotificationApiError for token not found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ code: 'TOKEN_NOT_FOUND', error: 'Not found' }),
    });

    await expect(
      unregisterDeviceToken('access-token', 'a'.repeat(150))
    ).rejects.toMatchObject({
      code: 'TOKEN_NOT_FOUND',
      status: 404,
    });
  });
});

describe('unregisterAllDeviceTokens', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('unregisters all tokens and returns count', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'All tokens unregistered', count: 3 }),
    });

    const result = await unregisterAllDeviceTokens('access-token');

    expect(result.count).toBe(3);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/firebase/tokens/all'),
      expect.objectContaining({
        method: 'DELETE',
      })
    );
  });
});

describe('getActiveDeviceTokens', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns active tokens list', async () => {
    const mockTokens = [
      {
        id: 'token-1',
        platform: 'ios',
        deviceId: 'device-1',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'token-2',
        platform: 'android',
        deviceName: 'Pixel 6',
        createdAt: '2026-01-02T00:00:00Z',
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ tokens: mockTokens }),
    });

    const result = await getActiveDeviceTokens('access-token');

    expect(result).toEqual(mockTokens);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/firebase/tokens'),
      expect.objectContaining({
        method: 'GET',
      })
    );
  });

  it('throws NotificationApiError for unauthorized', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ code: 'UNAUTHORIZED', error: 'Session expired' }),
    });

    await expect(getActiveDeviceTokens('expired-token')).rejects.toMatchObject({
      code: 'UNAUTHORIZED',
      status: 401,
    });
  });
});
