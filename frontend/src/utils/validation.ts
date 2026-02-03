/**
 * Shared validation utilities for form handling.
 */

/** Minimum required password length. */
export const PASSWORD_MIN_LENGTH = 8;

/** Password complexity regex: requires uppercase, lowercase, and a number. */
export const PASSWORD_REGEX = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

/**
 * Validates a password against the application's password policy.
 * @param password - The password to validate.
 * @returns Error message if invalid, undefined if valid.
 */
export function validatePassword(password: string): string | undefined {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must contain uppercase, lowercase, and a number';
  }
  return undefined;
}

/**
 * Email validation regex pattern.
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates an email address format.
 * @param email - The email to validate.
 * @returns Error message if invalid, undefined if valid.
 */
export function validateEmail(email: string): string | undefined {
  if (!email.trim()) {
    return 'Email is required';
  }
  if (!EMAIL_REGEX.test(email)) {
    return 'Please enter a valid email address';
  }
  return undefined;
}
