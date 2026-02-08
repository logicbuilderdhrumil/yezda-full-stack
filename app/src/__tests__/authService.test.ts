/**
 * Unit tests for auth service.
 * Task 1.8: Add unit and integration tests for auth flows.
 * Integration: Tests aligned with backend auth.routes.ts contracts.
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

import { AuthApiError } from '../services/authService';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Import after mocking
import { signIn, verifyMfa, refreshTokens, signOut } from '../services/authService';

describe('AuthApiError', () => {
  it('creates error with code, message, and status', () => {
    const error = new AuthApiError('INVALID_CREDENTIALS', 'Invalid password', 401);

    expect(error.code).toBe('INVALID_CREDENTIALS');
    expect(error.message).toBe('Invalid password');
    expect(error.status).toBe(401);
    expect(error.name).toBe('AuthApiError');
  });
});

describe('signIn', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns tokens on successful sign-in (aligned with backend response)', async () => {
    // Backend returns flat token fields, not nested tokens object
    const mockResponse = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await signIn({
      email: 'test@example.com',
      password: 'password',
      userType: 'candidate',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.tokenType).toBe('Bearer');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/auth/sign-in'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password',
          userType: 'candidate',
        }),
      })
    );
  });

  it('returns MFA challenge when required (aligned with backend response)', async () => {
    const mockResponse = {
      requiresMfa: true,
      mfaSessionToken: 'mfa-session-uuid',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await signIn({
      email: 'test@example.com',
      password: 'password',
      userType: 'user',
    });

    expect(result.requiresMfa).toBe(true);
    expect(result.mfaSessionToken).toBe('mfa-session-uuid');
    expect(result.accessToken).toBeUndefined();
  });

  it('throws AuthApiError for invalid credentials', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ code: 'INVALID', message: 'Bad credentials' }),
    });

    await expect(
      signIn({ email: 'test@example.com', password: 'wrong', userType: 'candidate' })
    ).rejects.toThrow(AuthApiError);
  });

  it('throws AuthApiError for locked account', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 423,
      json: () => Promise.resolve({ code: 'LOCKED', message: 'Account locked' }),
    });

    await expect(
      signIn({ email: 'test@example.com', password: 'password', userType: 'candidate' })
    ).rejects.toMatchObject({
      code: 'ACCOUNT_LOCKED',
      status: 423,
    });
  });

  it('throws AuthApiError for network errors', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(
      signIn({ email: 'test@example.com', password: 'password', userType: 'candidate' })
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });
});

describe('verifyMfa', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns tokens on successful verification (aligned with backend response)', async () => {
    // Backend returns flat token fields
    const mockResponse = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await verifyMfa({
      mfaSessionToken: '550e8400-e29b-41d4-a716-446655440000',
      mfaCode: '123456',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.tokenType).toBe('Bearer');
  });

  it('throws AuthApiError for invalid code', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ code: 'INVALID_CODE', message: 'Wrong code' }),
    });

    await expect(
      verifyMfa({ mfaSessionToken: '550e8400-e29b-41d4-a716-446655440000', mfaCode: '000000' })
    ).rejects.toMatchObject({
      code: 'MFA_FAILED',
    });
  });
});

describe('refreshTokens', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns new tokens on successful refresh (aligned with backend response)', async () => {
    // Backend returns flat token fields
    const mockResponse = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await refreshTokens('old-refresh-token');

    expect(result.accessToken).toBe('new-access-token');
    expect(result.tokenType).toBe('Bearer');
  });

  it('throws AuthApiError for expired refresh token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ code: 'EXPIRED', message: 'Token expired' }),
    });

    await expect(refreshTokens('expired-token')).rejects.toMatchObject({
      code: 'SESSION_EXPIRED',
    });
  });
});

describe('signOut', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('calls sign-out endpoint with access token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await signOut('access-token');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/auth/sign-out'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
        }),
      })
    );
  });

  it('does not throw on sign-out failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: 'Server error' }),
    });

    // Should not throw
    await expect(signOut('access-token')).resolves.toBeUndefined();
  });
});
