import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { AuthService } from './AuthService';
import type { AuthSession, SignInCredentials, SignUpCredentials } from '@/@types/auth';

vi.mock('axios');

const mockAxios = vi.mocked(axios, true);

describe('AuthService', () => {
  const mockSession: AuthSession = {
    accessToken: 'access-token-123',
    refreshToken: 'refresh-token-456',
    expiresAt: Date.now() + 3600000,
    user: {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      mfaEnabled: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAxios.create.mockReturnValue({
      post: vi.fn(),
      get: vi.fn(),
    } as unknown as ReturnType<typeof axios.create>);
  });

  describe('signIn', () => {
    it('returns session on successful sign-in without MFA', async () => {
      const credentials: SignInCredentials = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: { requiresMfa: false, session: mockSession },
        }),
        get: vi.fn(),
      };
      mockAxios.create.mockReturnValue(mockClient as unknown as ReturnType<typeof axios.create>);

      const result = await AuthService.signIn(credentials);

      expect(mockClient.post).toHaveBeenCalledWith('/sign-in', credentials);
      expect(result.requiresMfa).toBe(false);
      expect(result.session).toEqual(mockSession);
    });

    it('returns MFA token when MFA is required', async () => {
      const credentials: SignInCredentials = {
        email: 'test@example.com',
        password: 'Password123',
      };

      const mockClient = {
        post: vi.fn().mockResolvedValue({
          data: { requiresMfa: true, mfaToken: 'mfa-token-789' },
        }),
        get: vi.fn(),
      };
      mockAxios.create.mockReturnValue(mockClient as unknown as ReturnType<typeof axios.create>);

      const result = await AuthService.signIn(credentials);

      expect(result.requiresMfa).toBe(true);
      expect(result.mfaToken).toBe('mfa-token-789');
    });

    it('throws structured error on axios error', async () => {
      const credentials: SignInCredentials = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      const axiosError = {
        response: {
          data: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        },
      };

      const mockClient = {
        post: vi.fn().mockRejectedValue(axiosError),
        get: vi.fn(),
      };
      mockAxios.create.mockReturnValue(mockClient as unknown as ReturnType<typeof axios.create>);
      mockAxios.isAxiosError.mockReturnValue(true);

      await expect(AuthService.signIn(credentials)).rejects.toEqual({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
      });
    });
  });

  describe('signUp', () => {
    it('returns session on successful sign-up', async () => {
      const credentials: SignUpCredentials = {
        email: 'new@example.com',
        password: 'Password123',
        firstName: 'New',
        lastName: 'User',
        termsAccepted: true,
      };

      const mockClient = {
        post: vi.fn().mockResolvedValue({ data: mockSession }),
        get: vi.fn(),
      };
      mockAxios.create.mockReturnValue(mockClient as unknown as ReturnType<typeof axios.create>);

      const result = await AuthService.signUp(credentials);

      expect(mockClient.post).toHaveBeenCalledWith('/sign-up', credentials);
      expect(result).toEqual(mockSession);
    });
  });

  describe('requestPasswordReset', () => {
    it('resolves on successful request', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({}),
        get: vi.fn(),
      };
      mockAxios.create.mockReturnValue(mockClient as unknown as ReturnType<typeof axios.create>);

      await expect(
        AuthService.requestPasswordReset({ email: 'test@example.com' })
      ).resolves.toBeUndefined();

      expect(mockClient.post).toHaveBeenCalledWith('/forgot-password', {
        email: 'test@example.com',
      });
    });
  });

  describe('resetPassword', () => {
    it('resolves on successful reset', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({}),
        get: vi.fn(),
      };
      mockAxios.create.mockReturnValue(mockClient as unknown as ReturnType<typeof axios.create>);

      await expect(
        AuthService.resetPassword({ token: 'reset-token', password: 'NewPassword123' })
      ).resolves.toBeUndefined();

      expect(mockClient.post).toHaveBeenCalledWith('/reset-password', {
        token: 'reset-token',
        password: 'NewPassword123',
      });
    });
  });

  describe('resetCandidatePassword', () => {
    it('resolves on successful candidate reset', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({}),
        get: vi.fn(),
      };
      mockAxios.create.mockReturnValue(mockClient as unknown as ReturnType<typeof axios.create>);

      await expect(
        AuthService.resetCandidatePassword({
          token: 'reset-token',
          candidateId: 'cand-123',
          password: 'NewPassword123',
        })
      ).resolves.toBeUndefined();

      expect(mockClient.post).toHaveBeenCalledWith('/candidate-reset-password', {
        token: 'reset-token',
        candidateId: 'cand-123',
        password: 'NewPassword123',
      });
    });
  });

  describe('verifyTotp', () => {
    it('returns session on successful TOTP verification', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({ data: mockSession }),
        get: vi.fn(),
      };
      mockAxios.create.mockReturnValue(mockClient as unknown as ReturnType<typeof axios.create>);

      const result = await AuthService.verifyTotp({
        mfaToken: 'mfa-token-789',
        totpCode: '123456',
      });

      expect(mockClient.post).toHaveBeenCalledWith('/verify-totp', {
        mfaToken: 'mfa-token-789',
        totpCode: '123456',
      });
      expect(result).toEqual(mockSession);
    });
  });

  describe('signOut', () => {
    it('resolves even on error (best effort)', async () => {
      const mockClient = {
        post: vi.fn().mockRejectedValue(new Error('Network error')),
        get: vi.fn(),
      };
      mockAxios.create.mockReturnValue(mockClient as unknown as ReturnType<typeof axios.create>);

      await expect(AuthService.signOut()).resolves.toBeUndefined();
    });
  });

  describe('refreshToken', () => {
    it('returns new session on successful refresh', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({ data: mockSession }),
        get: vi.fn(),
      };
      mockAxios.create.mockReturnValue(mockClient as unknown as ReturnType<typeof axios.create>);

      const result = await AuthService.refreshToken('refresh-token-456');

      expect(mockClient.post).toHaveBeenCalledWith('/refresh', {
        refreshToken: 'refresh-token-456',
      });
      expect(result).toEqual(mockSession);
    });
  });

  describe('getCurrentUser', () => {
    it('returns session with authorization header', async () => {
      const mockClient = {
        post: vi.fn(),
        get: vi.fn().mockResolvedValue({ data: mockSession }),
      };
      mockAxios.create.mockReturnValue(mockClient as unknown as ReturnType<typeof axios.create>);

      const result = await AuthService.getCurrentUser('access-token-123');

      expect(mockClient.get).toHaveBeenCalledWith('/me', {
        headers: { Authorization: 'Bearer access-token-123' },
      });
      expect(result).toEqual(mockSession);
    });
  });
});
