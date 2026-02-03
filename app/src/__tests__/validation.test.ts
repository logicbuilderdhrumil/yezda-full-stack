/**
 * Unit tests for auth validation utilities.
 * Task 1.8: Add unit and integration tests for auth flows.
 */

import {
  validateLoginField,
  validateLoginForm,
  hasFormErrors,
} from '../utils/validation';
import { LoginFormValues, LoginFormErrors } from '../types/auth.types';

describe('validateLoginField', () => {
  describe('email validation', () => {
    it('returns error for empty email', () => {
      const error = validateLoginField('email', '');
      expect(error).toBe('Email is required');
    });

    it('returns error for whitespace-only email', () => {
      const error = validateLoginField('email', '   ');
      expect(error).toBe('Email is required');
    });

    it('returns error for invalid email format', () => {
      const error = validateLoginField('email', 'invalid-email');
      expect(error).toBe('Enter a valid email address');
    });

    it('returns error for email without domain', () => {
      const error = validateLoginField('email', 'user@');
      expect(error).toBe('Enter a valid email address');
    });

    it('returns undefined for valid email', () => {
      const error = validateLoginField('email', 'user@example.com');
      expect(error).toBeUndefined();
    });
  });

  describe('password validation', () => {
    it('returns error for empty password', () => {
      const error = validateLoginField('password', '');
      expect(error).toBe('Password is required');
    });

    it('returns error for short password', () => {
      const error = validateLoginField('password', '1234567');
      expect(error).toBe('Password must be at least 8 characters');
    });

    it('returns undefined for valid password', () => {
      const error = validateLoginField('password', '12345678');
      expect(error).toBeUndefined();
    });

    it('returns undefined for long password', () => {
      const error = validateLoginField('password', 'a-very-long-secure-password');
      expect(error).toBeUndefined();
    });
  });
});

describe('validateLoginForm', () => {
  it('returns errors for empty form', () => {
    const values: LoginFormValues = { email: '', password: '' };
    const errors = validateLoginForm(values);

    expect(errors).toEqual({
      email: 'Email is required',
      password: 'Password is required',
    });
  });

  it('returns null for valid form', () => {
    const values: LoginFormValues = {
      email: 'user@example.com',
      password: 'securepassword',
    };
    const errors = validateLoginForm(values);

    expect(errors).toBeNull();
  });

  it('returns only email error when password is valid', () => {
    const values: LoginFormValues = {
      email: 'invalid',
      password: 'securepassword',
    };
    const errors = validateLoginForm(values);

    expect(errors).toEqual({
      email: 'Enter a valid email address',
    });
  });

  it('returns only password error when email is valid', () => {
    const values: LoginFormValues = {
      email: 'user@example.com',
      password: 'short',
    };
    const errors = validateLoginForm(values);

    expect(errors).toEqual({
      password: 'Password must be at least 8 characters',
    });
  });
});

describe('hasFormErrors', () => {
  it('returns true when errors exist', () => {
    const errors: LoginFormErrors = { email: 'Invalid email' };
    expect(hasFormErrors(errors)).toBe(true);
  });

  it('returns false for empty errors object', () => {
    const errors: LoginFormErrors = {};
    expect(hasFormErrors(errors)).toBe(false);
  });

  it('returns false when all values are undefined', () => {
    const errors: LoginFormErrors = {
      email: undefined,
      password: undefined,
    };
    expect(hasFormErrors(errors)).toBe(false);
  });
});
