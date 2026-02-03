import { describe, it, expect } from 'vitest';
import {
  validatePassword,
  validateEmail,
  PASSWORD_MIN_LENGTH,
  PASSWORD_REGEX,
  EMAIL_REGEX,
} from './validation';

describe('validatePassword', () => {
  it('returns error for empty password', () => {
    expect(validatePassword('')).toBe('Password is required');
  });

  it('returns error for password shorter than minimum length', () => {
    expect(validatePassword('Ab1')).toBe(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
    );
    expect(validatePassword('Ab1defg')).toBe(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters`
    );
  });

  it('returns error when missing uppercase letter', () => {
    expect(validatePassword('abcdefgh1')).toBe(
      'Password must contain uppercase, lowercase, and a number'
    );
  });

  it('returns error when missing lowercase letter', () => {
    expect(validatePassword('ABCDEFGH1')).toBe(
      'Password must contain uppercase, lowercase, and a number'
    );
  });

  it('returns error when missing number', () => {
    expect(validatePassword('Abcdefghi')).toBe(
      'Password must contain uppercase, lowercase, and a number'
    );
  });

  it('returns undefined for valid password', () => {
    expect(validatePassword('Password1')).toBeUndefined();
    expect(validatePassword('SecurePass123')).toBeUndefined();
    expect(validatePassword('MyP@ssw0rd')).toBeUndefined();
  });
});

describe('validateEmail', () => {
  it('returns error for empty email', () => {
    expect(validateEmail('')).toBe('Email is required');
    expect(validateEmail('   ')).toBe('Email is required');
  });

  it('returns error for invalid email format', () => {
    expect(validateEmail('notanemail')).toBe('Please enter a valid email address');
    expect(validateEmail('missing@domain')).toBe('Please enter a valid email address');
    expect(validateEmail('@nodomain.com')).toBe('Please enter a valid email address');
    expect(validateEmail('spaces in@email.com')).toBe('Please enter a valid email address');
  });

  it('returns undefined for valid email', () => {
    expect(validateEmail('user@example.com')).toBeUndefined();
    expect(validateEmail('name.last@domain.co.uk')).toBeUndefined();
    expect(validateEmail('user+tag@example.org')).toBeUndefined();
  });
});

describe('PASSWORD_REGEX', () => {
  it('matches passwords with uppercase, lowercase, and number', () => {
    expect(PASSWORD_REGEX.test('Password1')).toBe(true);
    expect(PASSWORD_REGEX.test('aB3')).toBe(true);
  });

  it('does not match passwords missing requirements', () => {
    expect(PASSWORD_REGEX.test('password1')).toBe(false);
    expect(PASSWORD_REGEX.test('PASSWORD1')).toBe(false);
    expect(PASSWORD_REGEX.test('Password')).toBe(false);
  });
});

describe('EMAIL_REGEX', () => {
  it('matches valid email formats', () => {
    expect(EMAIL_REGEX.test('user@example.com')).toBe(true);
    expect(EMAIL_REGEX.test('a@b.co')).toBe(true);
  });

  it('does not match invalid email formats', () => {
    expect(EMAIL_REGEX.test('notanemail')).toBe(false);
    expect(EMAIL_REGEX.test('@missing.com')).toBe(false);
  });
});
