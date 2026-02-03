/**
 * Unit tests for secure storage utilities.
 * Task 1.8: Add unit and integration tests for auth flows.
 */

import * as SecureStore from 'expo-secure-store';
import {
  storeTokens,
  getStoredTokens,
  clearStoredTokens,
  isTokenExpired,
  hasValidStoredSession,
} from '../utils/secureStorage';
import { SessionTokens } from '../types/auth.types';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockSetItem = SecureStore.setItemAsync as jest.Mock;
const mockGetItem = SecureStore.getItemAsync as jest.Mock;
const mockDeleteItem = SecureStore.deleteItemAsync as jest.Mock;

describe('storeTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores all token fields securely', async () => {
    const tokens: SessionTokens = {
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
      expiresAt: 1700000000000,
    };

    await storeTokens(tokens);

    expect(mockSetItem).toHaveBeenCalledTimes(3);
    expect(mockSetItem).toHaveBeenCalledWith('auth_access_token', 'access-123');
    expect(mockSetItem).toHaveBeenCalledWith('auth_refresh_token', 'refresh-456');
    expect(mockSetItem).toHaveBeenCalledWith('auth_expires_at', '1700000000000');
  });
});

describe('getStoredTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns tokens when all values present', async () => {
    mockGetItem
      .mockResolvedValueOnce('access-123')
      .mockResolvedValueOnce('refresh-456')
      .mockResolvedValueOnce('1700000000000');

    const tokens = await getStoredTokens();

    expect(tokens).toEqual({
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
      expiresAt: 1700000000000,
    });
  });

  it('returns null when access token missing', async () => {
    mockGetItem
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('refresh-456')
      .mockResolvedValueOnce('1700000000000');

    const tokens = await getStoredTokens();

    expect(tokens).toBeNull();
  });

  it('returns null when refresh token missing', async () => {
    mockGetItem
      .mockResolvedValueOnce('access-123')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce('1700000000000');

    const tokens = await getStoredTokens();

    expect(tokens).toBeNull();
  });

  it('returns null when expires_at missing', async () => {
    mockGetItem
      .mockResolvedValueOnce('access-123')
      .mockResolvedValueOnce('refresh-456')
      .mockResolvedValueOnce(null);

    const tokens = await getStoredTokens();

    expect(tokens).toBeNull();
  });

  it('returns null when expires_at is not a number', async () => {
    mockGetItem
      .mockResolvedValueOnce('access-123')
      .mockResolvedValueOnce('refresh-456')
      .mockResolvedValueOnce('not-a-number');

    const tokens = await getStoredTokens();

    expect(tokens).toBeNull();
  });

  it('returns null on error', async () => {
    mockGetItem.mockRejectedValueOnce(new Error('Storage error'));

    const tokens = await getStoredTokens();

    expect(tokens).toBeNull();
  });
});

describe('clearStoredTokens', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deletes all token fields', async () => {
    await clearStoredTokens();

    expect(mockDeleteItem).toHaveBeenCalledTimes(3);
    expect(mockDeleteItem).toHaveBeenCalledWith('auth_access_token');
    expect(mockDeleteItem).toHaveBeenCalledWith('auth_refresh_token');
    expect(mockDeleteItem).toHaveBeenCalledWith('auth_expires_at');
  });
});

describe('isTokenExpired', () => {
  it('returns true when token is expired', () => {
    const pastTime = Date.now() - 60000; // 1 minute ago
    expect(isTokenExpired(pastTime)).toBe(true);
  });

  it('returns true when token expires within buffer', () => {
    const soonTime = Date.now() + 30000; // 30 seconds from now
    expect(isTokenExpired(soonTime, 60000)).toBe(true); // 60s buffer
  });

  it('returns false when token is valid', () => {
    const futureTime = Date.now() + 3600000; // 1 hour from now
    expect(isTokenExpired(futureTime)).toBe(false);
  });

  it('respects custom buffer', () => {
    const futureTime = Date.now() + 10000; // 10 seconds from now
    expect(isTokenExpired(futureTime, 5000)).toBe(false); // 5s buffer
    expect(isTokenExpired(futureTime, 15000)).toBe(true); // 15s buffer
  });
});

describe('hasValidStoredSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true for valid non-expired session', async () => {
    const futureExpiry = Date.now() + 3600000;
    mockGetItem
      .mockResolvedValueOnce('access-123')
      .mockResolvedValueOnce('refresh-456')
      .mockResolvedValueOnce(futureExpiry.toString());

    const result = await hasValidStoredSession();

    expect(result).toBe(true);
  });

  it('returns false when no tokens stored', async () => {
    mockGetItem.mockResolvedValue(null);

    const result = await hasValidStoredSession();

    expect(result).toBe(false);
  });

  it('returns false when tokens are expired', async () => {
    const pastExpiry = Date.now() - 3600000;
    mockGetItem
      .mockResolvedValueOnce('access-123')
      .mockResolvedValueOnce('refresh-456')
      .mockResolvedValueOnce(pastExpiry.toString());

    const result = await hasValidStoredSession();

    expect(result).toBe(false);
  });
});
