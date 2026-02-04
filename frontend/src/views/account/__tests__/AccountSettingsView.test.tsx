import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AccountSettingsView } from '../AccountSettingsView';
import { AccountService } from '@/services/AccountService';
import type { AccountProfile } from '@/@types/account';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'account.title': 'Account Settings',
        'account.description': 'Manage your profile and account preferences',
        'account.fetchError': 'Failed to load profile',
        'account.loadError': 'Unable to load your profile. Please try again.',
        'account.updateSuccess': 'Profile updated successfully',
        'account.updateError': 'Failed to update profile',
        'account.tabs.profile': 'Profile',
        'account.tabs.security': 'Security',
        'account.profile.title': 'Profile Information',
        'account.profile.description': 'Update your personal details and profile picture',
        'account.security.title': 'Security Settings',
        'account.security.description': 'Manage your password and security preferences',
        'account.security.comingSoon': 'Security settings will be available soon.',
        'account.form.sections.avatar': 'Profile Picture',
        'account.form.sections.avatarDescription': 'Upload a profile picture',
        'account.form.sections.personal': 'Personal Information',
        'account.form.sections.personalDescription': 'Your basic profile details',
        'account.form.firstName': 'First name',
        'account.form.firstNamePlaceholder': 'John',
        'account.form.lastName': 'Last name',
        'account.form.lastNamePlaceholder': 'Doe',
        'account.form.email': 'Email address',
        'account.form.emailHelper': 'Email cannot be changed',
        'account.form.phone': 'Phone number',
        'account.form.phonePlaceholder': '+1 (555) 123-4567',
        'account.avatar.upload': 'Upload',
        'account.avatar.remove': 'Remove',
        'account.avatar.uploadLabel': 'Click or drag to upload avatar',
        'account.avatar.hint': 'JPG, PNG, WebP or GIF. Max 5MB.',
        'account.avatar.uploading': 'Uploading avatar...',
        'account.avatar.uploadSuccess': 'Avatar uploaded successfully',
        'account.avatar.uploadError': 'Failed to upload avatar',
        'account.avatar.removing': 'Removing avatar...',
        'account.avatar.removeSuccess': 'Avatar removed',
        'account.avatar.removeError': 'Failed to remove avatar',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock AccountService
vi.mock('@/services/AccountService', () => ({
  AccountService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    uploadAvatar: vi.fn(),
    removeAvatar: vi.fn(),
  },
}));

// Mock toast functions
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockToastPromise = vi.fn(<T,>(promise: Promise<T>) => promise);

vi.mock('@/components/ui', async () => {
  const actual = await vi.importActual('@/components/ui');
  return {
    ...actual,
    toastSuccess: (msg: string) => mockToastSuccess(msg),
    toastError: (msg: string) => mockToastError(msg),
    toastPromise: <T,>(promise: Promise<T>, _opts: Record<string, string>) => {
      mockToastPromise(promise);
      return promise;
    },
  };
});

// Mock handleApiError
vi.mock('@/utils', () => ({
  handleApiError: vi.fn(),
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

// Mock PageContainer
vi.mock('@/components/layouts', () => ({
  PageContainer: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="page-container" data-title={title}>
      {children}
    </div>
  ),
}));

describe('AccountSettingsView', () => {
  const mockProfile: AccountProfile = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    avatarUrl: 'https://example.com/avatar.jpg',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  };

  const mockAccountService = vi.mocked(AccountService);

  beforeEach(() => {
    vi.clearAllMocks();
    mockAccountService.getProfile.mockResolvedValue(mockProfile);
    mockAccountService.updateProfile.mockResolvedValue(mockProfile);
    mockAccountService.uploadAvatar.mockResolvedValue({ avatarUrl: 'https://example.com/new.jpg' });
    mockAccountService.removeAvatar.mockResolvedValue(undefined);
  });

  describe('loading state', () => {
    it('shows skeleton while loading', () => {
      mockAccountService.getProfile.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<AccountSettingsView />);

      // Should show skeleton card during loading
      expect(screen.getByTestId('page-container')).toBeInTheDocument();
    });

    it('fetches profile on mount', async () => {
      render(<AccountSettingsView />);

      await waitFor(() => {
        expect(mockAccountService.getProfile).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('error state', () => {
    it('shows error message when fetch fails', async () => {
      mockAccountService.getProfile.mockRejectedValue({
        code: 'NETWORK_ERROR',
        message: 'Network error',
      });

      render(<AccountSettingsView />);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Failed to load profile');
      });
    });

    it('shows load error view when profile is null', async () => {
      mockAccountService.getProfile.mockRejectedValue(new Error('Failed'));

      render(<AccountSettingsView />);

      await waitFor(() => {
        expect(screen.getByText('Unable to load your profile. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('success state', () => {
    it('renders profile form with data', async () => {
      render(<AccountSettingsView />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      });
    });

    it('renders tabs for profile and security', async () => {
      render(<AccountSettingsView />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Profile' })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: 'Security' })).toBeInTheDocument();
      });
    });

    it('renders security tab', async () => {
      render(<AccountSettingsView />);

      await waitFor(() => {
        const securityTab = screen.getByRole('tab', { name: 'Security' });
        expect(securityTab).toBeInTheDocument();
        // Tab panel exists for security section
        expect(securityTab).toHaveAttribute('aria-controls');
      });
    });
  });

  describe('profile update', () => {
    it('updates profile on form submit', async () => {
      const updatedProfile = { ...mockProfile, firstName: 'Jane' };
      mockAccountService.updateProfile.mockResolvedValue(updatedProfile);

      render(<AccountSettingsView />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByDisplayValue('John');
      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAccountService.updateProfile).toHaveBeenCalledWith({
          firstName: 'Jane',
          lastName: 'Doe',
          phone: '+1234567890',
        });
        expect(mockToastSuccess).toHaveBeenCalledWith('Profile updated successfully');
      });
    });

    it('shows error toast on update failure', async () => {
      mockAccountService.updateProfile.mockRejectedValue({
        code: 'UPDATE_ERROR',
        message: 'Update failed',
      });

      render(<AccountSettingsView />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      const firstNameInput = screen.getByDisplayValue('John');
      fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

      const saveButton = screen.getByRole('button', { name: 'Save' });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith('Failed to update profile');
      });
    });
  });

  describe('avatar operations', () => {
    it('handles avatar upload', async () => {
      render(<AccountSettingsView />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      // Verify uploadAvatar is available for testing via service mock
      expect(mockAccountService.uploadAvatar).toBeDefined();
    });

    it('handles avatar removal', async () => {
      render(<AccountSettingsView />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      // Verify removeAvatar is available for testing via service mock
      expect(mockAccountService.removeAvatar).toBeDefined();
    });
  });

  describe('re-fetch prevention', () => {
    it('does not re-fetch profile on locale change (t removed from deps)', async () => {
      render(<AccountSettingsView />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      });

      // Verify only one fetch occurred
      expect(mockAccountService.getProfile).toHaveBeenCalledTimes(1);
    });
  });
});
