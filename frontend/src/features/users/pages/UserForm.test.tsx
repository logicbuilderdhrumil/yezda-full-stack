/**
 * Tests for UserForm validation logic and component behavior.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { validateForm, UserForm } from './UserForm';
import type { CreateUserPayload } from '@/@types/user';

// Mock translation function that returns the key
const mockT = (key: string): string => key;

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
  }),
}));

// Mock UI components
vi.mock('@/components/ui', () => ({
  Button: ({ children, ...props }: { children: React.ReactNode }) => (
    <button {...props}>{children}</button>
  ),
  Input: ({ value, onChange, ...props }: { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <input value={value} onChange={onChange} {...props} />
  ),
  Select: ({ children, value, onValueChange }: { children: React.ReactNode; value: string; onValueChange: (v: string) => void }) => (
    <div data-testid="select" data-value={value} onClick={() => onValueChange('user')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <div data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: () => <span>Value</span>,
  FormField: ({ children, label, error, required }: { children: React.ReactNode; label: string; error?: string; required?: boolean }) => (
    <div>
      <label>
        {label}
        {required && ' *'}
      </label>
      {children}
      {error && <span role="alert">{error}</span>}
    </div>
  ),
  FormSection: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <fieldset>
      <legend>{title}</legend>
      {children}
    </fieldset>
  ),
  FormActions: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LoadingSpinner: () => <span data-testid="spinner" />,
  Checkbox: ({ checked, onCheckedChange, id }: { checked: boolean; onCheckedChange: (v: boolean) => void; id: string }) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
    />
  ),
}));

describe('validateForm', () => {
  describe('email validation', () => {
    it('returns error when email is empty', () => {
      const data: Partial<CreateUserPayload> = {
        email: '',
        firstName: 'John',
        lastName: 'Doe',
        sendInvitation: true,
      };
      const errors = validateForm(data, false, mockT);
      expect(errors.email).toBe('users.form.validation.emailRequired');
    });

    it('returns error when email is invalid', () => {
      const data: Partial<CreateUserPayload> = {
        email: 'invalid-email',
        firstName: 'John',
        lastName: 'Doe',
        sendInvitation: true,
      };
      const errors = validateForm(data, false, mockT);
      expect(errors.email).toBe('users.form.validation.emailInvalid');
    });

    it('returns no error for valid email', () => {
      const data: Partial<CreateUserPayload> = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        sendInvitation: true,
      };
      const errors = validateForm(data, false, mockT);
      expect(errors.email).toBeUndefined();
    });
  });

  describe('name validation', () => {
    it('returns error when firstName is empty', () => {
      const data: Partial<CreateUserPayload> = {
        email: 'test@example.com',
        firstName: '',
        lastName: 'Doe',
        sendInvitation: true,
      };
      const errors = validateForm(data, false, mockT);
      expect(errors.firstName).toBe('users.form.validation.firstNameRequired');
    });

    it('returns error when lastName is empty', () => {
      const data: Partial<CreateUserPayload> = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: '',
        sendInvitation: true,
      };
      const errors = validateForm(data, false, mockT);
      expect(errors.lastName).toBe('users.form.validation.lastNameRequired');
    });
  });

  describe('password validation', () => {
    it('requires password when sendInvitation is false in create mode', () => {
      const data: Partial<CreateUserPayload> = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        sendInvitation: false,
        password: '',
      };
      const errors = validateForm(data, false, mockT);
      expect(errors.password).toBe('users.form.validation.passwordMinLength');
    });

    it('requires password to be at least 8 characters when sendInvitation is false', () => {
      const data: Partial<CreateUserPayload> = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        sendInvitation: false,
        password: 'short',
      };
      const errors = validateForm(data, false, mockT);
      expect(errors.password).toBe('users.form.validation.passwordMinLength');
    });

    it('accepts valid password when sendInvitation is false', () => {
      const data: Partial<CreateUserPayload> = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        sendInvitation: false,
        password: 'validpass123',
      };
      const errors = validateForm(data, false, mockT);
      expect(errors.password).toBeUndefined();
    });

    it('does not require password when sendInvitation is true', () => {
      const data: Partial<CreateUserPayload> = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        sendInvitation: true,
      };
      const errors = validateForm(data, false, mockT);
      expect(errors.password).toBeUndefined();
    });

    it('does not require password in edit mode', () => {
      const data: Partial<CreateUserPayload> = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        sendInvitation: false,
      };
      const errors = validateForm(data, true, mockT);
      expect(errors.password).toBeUndefined();
    });

    it('validates password length if provided in sendInvitation mode', () => {
      const data: Partial<CreateUserPayload> = {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        sendInvitation: true,
        password: 'short',
      };
      const errors = validateForm(data, false, mockT);
      expect(errors.password).toBe('users.form.validation.passwordMinLength');
    });
  });
});

describe('UserForm component', () => {
  const defaultProps = {
    onSubmit: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all required fields', () => {
    render(<UserForm {...defaultProps} />);
    
    expect(screen.getByPlaceholderText('users.form.firstNamePlaceholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('users.form.lastNamePlaceholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('users.form.emailPlaceholder')).toBeInTheDocument();
  });

  it('disables inputs when isSubmitting is true', () => {
    render(<UserForm {...defaultProps} isSubmitting />);
    
    expect(screen.getByPlaceholderText('users.form.firstNamePlaceholder')).toBeDisabled();
    expect(screen.getByPlaceholderText('users.form.lastNamePlaceholder')).toBeDisabled();
    expect(screen.getByPlaceholderText('users.form.emailPlaceholder')).toBeDisabled();
  });
});
