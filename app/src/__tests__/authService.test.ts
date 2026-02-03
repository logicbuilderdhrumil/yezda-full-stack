/**
 * Unit tests for auth service.
 * Task 1.8: Add unit and integration tests for auth flows.
 */

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

  it('returns tokens and user on successful sign-in', async () => {
    const mockResponse = {
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
      },
      user: {
        id: 'user-1',
        email: 'test@example.com',
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await signIn({ email: 'test@example.com', password: 'password' });

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/auth/signin'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com', password: 'password' }),
      })
    );
  });

  it('returns MFA challenge when required', async () => {
    const mockResponse = {
      mfaChallenge: {
        challengeId: 'challenge-123',
        type: 'totp',
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await signIn({ email: 'test@example.com', password: 'password' });

    expect(result.mfaChallenge).toEqual(mockResponse.mfaChallenge);
    expect(result.tokens).toBeUndefined();
  });

  it('throws AuthApiError for invalid credentials', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ code: 'INVALID', message: 'Bad credentials' }),
    });

    await expect(
      signIn({ email: 'test@example.com', password: 'wrong' })
    ).rejects.toThrow(AuthApiError);
  });

  it('throws AuthApiError for locked account', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 423,
      json: () => Promise.resolve({ code: 'LOCKED', message: 'Account locked' }),
    });

    await expect(
      signIn({ email: 'test@example.com', password: 'password' })
    ).rejects.toMatchObject({
      code: 'ACCOUNT_LOCKED',
      status: 423,
    });
  });

  it('throws AuthApiError for network errors', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(
      signIn({ email: 'test@example.com', password: 'password' })
    ).rejects.toMatchObject({
      code: 'NETWORK_ERROR',
    });
  });
});

describe('verifyMfa', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns tokens on successful verification', async () => {
    const mockResponse = {
      tokens: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: Date.now() + 3600000,
      },
      user: {
        id: 'user-1',
        email: 'test@example.com',
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await verifyMfa({ challengeId: 'challenge-123', code: '123456' });

    expect(result).toEqual(mockResponse);
  });

  it('throws AuthApiError for invalid code', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ code: 'INVALID_CODE', message: 'Wrong code' }),
    });

    await expect(
      verifyMfa({ challengeId: 'challenge-123', code: '000000' })
    ).rejects.toMatchObject({
      code: 'MFA_FAILED',
    });
  });
});

describe('refreshTokens', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns new tokens on successful refresh', async () => {
    const mockResponse = {
      tokens: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: Date.now() + 3600000,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await refreshTokens('old-refresh-token');

    expect(result).toEqual(mockResponse);
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
      expect.stringContaining('/v1/auth/signout'),
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
