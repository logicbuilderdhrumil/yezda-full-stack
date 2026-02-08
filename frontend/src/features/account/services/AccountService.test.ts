import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import type {
  AccountProfile,
  UpdateProfilePayload,
  AvatarUploadResponse,
  ChangePasswordPayload,
} from '@/@types/account';

// Hoist mock setup before module imports
const mockClient = {
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
};

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockClient),
    isAxiosError: vi.fn(),
  },
}));

const mockAxios = vi.mocked(axios, true);

describe('AccountService', () => {
  const mockProfile: AccountProfile = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    avatarUrl: 'https://example.com/avatar.jpg',
    timezone: 'America/New_York',
    locale: 'en',
    notificationsEnabled: true,
    emailNotificationsEnabled: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  };

  // Import dynamically after mocking
  let AccountService: typeof import('./AccountService').AccountService;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Re-import the module to get fresh instance with mocked axios
    vi.resetModules();
    const mod = await import('./AccountService');
    AccountService = mod.AccountService;
  });

  describe('getProfile', () => {
    it('returns profile data on success', async () => {
      mockClient.get.mockResolvedValue({ data: mockProfile });

      const result = await AccountService.getProfile();

      expect(mockClient.get).toHaveBeenCalledWith('/profile');
      expect(result).toEqual(mockProfile);
    });

    it('throws structured error on axios error', async () => {
      const axiosError = {
        response: {
          data: {
            code: 'PROFILE_NOT_FOUND',
            message: 'Profile not found',
          },
        },
      };

      mockClient.get.mockRejectedValue(axiosError);
      mockAxios.isAxiosError.mockReturnValue(true);

      await expect(AccountService.getProfile()).rejects.toEqual({
        code: 'PROFILE_NOT_FOUND',
        message: 'Profile not found',
      });
    });

    it('throws network error when no response data', async () => {
      mockClient.get.mockRejectedValue(new Error('Network failure'));
      mockAxios.isAxiosError.mockReturnValue(false);

      await expect(AccountService.getProfile()).rejects.toEqual({
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to the server',
      });
    });
  });

  describe('updateProfile', () => {
    const updatePayload: UpdateProfilePayload = {
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+9876543210',
    };

    it('returns updated profile on success', async () => {
      const updatedProfile = { ...mockProfile, ...updatePayload };
      mockClient.patch.mockResolvedValue({ data: updatedProfile });

      const result = await AccountService.updateProfile(updatePayload);

      expect(mockClient.patch).toHaveBeenCalledWith('/profile', updatePayload);
      expect(result).toEqual(updatedProfile);
    });

    it('throws structured error with field info', async () => {
      const axiosError = {
        response: {
          data: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid phone format',
            field: 'phone',
          },
        },
      };

      mockClient.patch.mockRejectedValue(axiosError);
      mockAxios.isAxiosError.mockReturnValue(true);

      await expect(AccountService.updateProfile(updatePayload)).rejects.toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Invalid phone format',
        field: 'phone',
      });
    });
  });

  describe('uploadAvatar', () => {
    it('returns avatar URL on success', async () => {
      const response: AvatarUploadResponse = {
        avatarUrl: 'https://example.com/new-avatar.jpg',
      };
      mockClient.post.mockResolvedValue({ data: response });

      const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });
      const result = await AccountService.uploadAvatar(file);

      expect(mockClient.post).toHaveBeenCalledWith(
        '/avatar',
        expect.any(FormData),
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      expect(result).toEqual(response);
    });

    it('includes file in FormData', async () => {
      mockClient.post.mockResolvedValue({
        data: { avatarUrl: 'https://example.com/avatar.jpg' },
      });

      const file = new File(['test'], 'avatar.png', { type: 'image/png' });
      await AccountService.uploadAvatar(file);

      const calls = mockClient.post.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const calledFormData = calls[0]?.[1] as FormData | undefined;
      expect(calledFormData?.get('avatar')).toEqual(file);
    });

    it('throws error on upload failure', async () => {
      const axiosError = {
        response: {
          data: {
            code: 'UPLOAD_ERROR',
            message: 'File too large',
          },
        },
      };

      mockClient.post.mockRejectedValue(axiosError);
      mockAxios.isAxiosError.mockReturnValue(true);

      const file = new File(['test'], 'large.jpg', { type: 'image/jpeg' });
      await expect(AccountService.uploadAvatar(file)).rejects.toEqual({
        code: 'UPLOAD_ERROR',
        message: 'File too large',
      });
    });
  });

  describe('removeAvatar', () => {
    it('resolves on success', async () => {
      mockClient.delete.mockResolvedValue({});

      await expect(AccountService.removeAvatar()).resolves.toBeUndefined();
      expect(mockClient.delete).toHaveBeenCalledWith('/avatar');
    });

    it('throws error on failure', async () => {
      const axiosError = {
        response: {
          data: {
            code: 'REMOVE_ERROR',
            message: 'Failed to remove avatar',
          },
        },
      };

      mockClient.delete.mockRejectedValue(axiosError);
      mockAxios.isAxiosError.mockReturnValue(true);

      await expect(AccountService.removeAvatar()).rejects.toEqual({
        code: 'REMOVE_ERROR',
        message: 'Failed to remove avatar',
      });
    });
  });

  describe('changePassword', () => {
    const passwordPayload: ChangePasswordPayload = {
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword456',
    };

    it('resolves on success', async () => {
      mockClient.post.mockResolvedValue({});

      await expect(AccountService.changePassword(passwordPayload)).resolves.toBeUndefined();
      expect(mockClient.post).toHaveBeenCalledWith('/password', passwordPayload);
    });

    it('throws error on invalid current password', async () => {
      const axiosError = {
        response: {
          data: {
            code: 'INVALID_PASSWORD',
            message: 'Current password is incorrect',
            field: 'currentPassword',
          },
        },
      };

      mockClient.post.mockRejectedValue(axiosError);
      mockAxios.isAxiosError.mockReturnValue(true);

      await expect(AccountService.changePassword(passwordPayload)).rejects.toEqual({
        code: 'INVALID_PASSWORD',
        message: 'Current password is incorrect',
        field: 'currentPassword',
      });
    });
  });

  describe('error extraction', () => {
    it('uses default code when none provided', async () => {
      const axiosError = {
        response: {
          data: {
            message: 'Something went wrong',
          },
        },
      };

      mockClient.get.mockRejectedValue(axiosError);
      mockAxios.isAxiosError.mockReturnValue(true);

      await expect(AccountService.getProfile()).rejects.toEqual({
        code: 'ACCOUNT_ERROR',
        message: 'Something went wrong',
      });
    });

    it('uses default message when none provided', async () => {
      const axiosError = {
        response: {
          data: {
            code: 'UNKNOWN',
          },
        },
      };

      mockClient.get.mockRejectedValue(axiosError);
      mockAxios.isAxiosError.mockReturnValue(true);

      await expect(AccountService.getProfile()).rejects.toEqual({
        code: 'UNKNOWN',
        message: 'An unexpected error occurred',
      });
    });
  });
});
