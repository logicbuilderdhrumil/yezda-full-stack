import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileForm, type ProfileFormProps } from '../ProfileForm';
import type { AccountProfile } from '@/@types/account';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
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
        'account.form.validation.firstNameRequired': 'First name is required',
        'account.form.validation.lastNameRequired': 'Last name is required',
        'account.form.validation.phoneInvalid': 'Invalid phone number',
        'account.avatar.upload': 'Upload',
        'account.avatar.remove': 'Remove',
        'account.avatar.uploadLabel': 'Click or drag to upload avatar',
        'account.avatar.hint': 'JPG, PNG, WebP or GIF. Max 5MB.',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock toastError
vi.mock('@/components/ui', async () => {
  const actual = await vi.importActual('@/components/ui');
  return {
    ...actual,
    toastError: vi.fn(),
  };
});

describe('ProfileForm', () => {
  const mockProfile: AccountProfile = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1234567890',
    avatarUrl: 'https://example.com/avatar.jpg',
    notificationsEnabled: true,
    emailNotificationsEnabled: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  };

  const defaultProps: ProfileFormProps = {
    profile: mockProfile,
    onSubmit: vi.fn(),
    onAvatarUpload: vi.fn(),
    onAvatarRemove: vi.fn(),
    isSubmitting: false,
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with profile data', () => {
    render(<ProfileForm {...defaultProps} />);

    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+1234567890')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
  });

  it('disables email field', () => {
    render(<ProfileForm {...defaultProps} />);

    const emailInput = screen.getByDisplayValue('test@example.com');
    expect(emailInput).toBeDisabled();
  });

  it('disables save button when no changes', () => {
    render(<ProfileForm {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('enables save button when form is modified', () => {
    render(<ProfileForm {...defaultProps} />);

    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('validates required first name', async () => {
    render(<ProfileForm {...defaultProps} />);

    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change(firstNameInput, { target: { value: '' } });

    // Trigger submit to show validation
    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('First name is required')).toBeInTheDocument();
    });
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('validates required last name', async () => {
    render(<ProfileForm {...defaultProps} />);

    const lastNameInput = screen.getByDisplayValue('Doe');
    fireEvent.change(lastNameInput, { target: { value: '' } });

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Last name is required')).toBeInTheDocument();
    });
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('validates phone format', async () => {
    render(<ProfileForm {...defaultProps} />);

    const phoneInput = screen.getByDisplayValue('+1234567890');
    fireEvent.change(phoneInput, { target: { value: 'invalid-phone!@#' } });

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid phone number')).toBeInTheDocument();
    });
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with valid data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ProfileForm {...defaultProps} onSubmit={onSubmit} />);

    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+1234567890',
      });
    });
  });

  it('resets form on cancel', () => {
    render(<ProfileForm {...defaultProps} />);

    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
  });

  it('disables form inputs when submitting', () => {
    render(<ProfileForm {...defaultProps} isSubmitting={true} />);

    expect(screen.getByDisplayValue('John')).toBeDisabled();
    expect(screen.getByDisplayValue('Doe')).toBeDisabled();
    const phoneInput = screen.getByPlaceholderText('+1 (555) 123-4567');
    expect(phoneInput).toBeDisabled();
  });

  it('syncs form state when profile prop changes', async () => {
    const { rerender } = render(<ProfileForm {...defaultProps} />);

    expect(screen.getByDisplayValue('John')).toBeInTheDocument();

    // Simulate profile update from server
    const updatedProfile: AccountProfile = {
      ...mockProfile,
      firstName: 'Updated',
      lastName: 'Name',
      phone: '+9999999999',
    };

    rerender(<ProfileForm {...defaultProps} profile={updatedProfile} />);

    expect(screen.getByDisplayValue('Updated')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Name')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+9999999999')).toBeInTheDocument();
  });

  it('allows empty phone number', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ProfileForm {...defaultProps} onSubmit={onSubmit} />);

    const phoneInput = screen.getByDisplayValue('+1234567890');
    fireEvent.change(phoneInput, { target: { value: '' } });

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        phone: undefined,
      });
    });
  });

  it('trims whitespace from form values', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<ProfileForm {...defaultProps} onSubmit={onSubmit} />);

    const firstNameInput = screen.getByDisplayValue('John');
    fireEvent.change(firstNameInput, { target: { value: '  Jane  ' } });

    const saveButton = screen.getByRole('button', { name: 'Save' });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Jane',
        })
      );
    });
  });
});
