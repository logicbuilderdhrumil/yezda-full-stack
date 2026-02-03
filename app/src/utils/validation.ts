/**
 * Validation utilities for form fields.
 * Task 1.1: Form validation helpers.
 */

import {
  LoginFormValues,
  LoginFormErrors,
  loginValidationRules,
} from '../types/auth.types';

/**
 * Validates a single login form field.
 */
export function validateLoginField(
  field: keyof LoginFormValues,
  value: string
): string | undefined {
  const rules = loginValidationRules[field];

  // Required check
  if (rules.required && !value.trim()) {
    return rules.required;
  }

  // Pattern check for email
  if (field === 'email' && 'pattern' in rules && value) {
    const { pattern } = rules as typeof loginValidationRules.email;
    if (!pattern.value.test(value)) {
      return pattern.message;
    }
  }

  // MinLength check for password
  if (field === 'password' && 'minLength' in rules && value) {
    const { minLength } = rules as typeof loginValidationRules.password;
    if (value.length < minLength.value) {
      return minLength.message;
    }
  }

  return undefined;
}

/**
 * Validates the entire login form.
 * Returns errors object or null if valid.
 */
export function validateLoginForm(values: LoginFormValues): LoginFormErrors | null {
  const errors: LoginFormErrors = {};

  const emailError = validateLoginField('email', values.email);
  if (emailError) {
    errors.email = emailError;
  }

  const passwordError = validateLoginField('password', values.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Checks if the form has any errors.
 */
export function hasFormErrors(errors: LoginFormErrors): boolean {
  return Object.values(errors).some((error) => !!error);
}
