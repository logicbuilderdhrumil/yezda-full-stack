/**
 * Profile validation utilities for form fields.
 * Task 1.1: Profile form validation helpers.
 */

import {
  ProfileFormValues,
  ProfileFormErrors,
  profileValidationRules,
} from '../types/profile.types';

type ProfileFieldKey = keyof ProfileFormValues;

/**
 * Validates a single profile form field.
 */
export function validateProfileField(
  field: ProfileFieldKey,
  value: string
): string | undefined {
  const rules = profileValidationRules[field];

  // Required check (only for required fields)
  if ('required' in rules && rules.required && !value.trim()) {
    return rules.required as string;
  }

  // Skip further validation if value is empty and field is optional
  if (!value.trim()) {
    return undefined;
  }

  // MaxLength check
  if ('maxLength' in rules && rules.maxLength) {
    const { maxLength } = rules;
    if (value.length > maxLength.value) {
      return maxLength.message;
    }
  }

  // MinLength check
  if ('minLength' in rules && rules.minLength) {
    const { minLength } = rules;
    if (value.length < minLength.value) {
      return minLength.message;
    }
  }

  // Pattern check
  if ('pattern' in rules && rules.pattern) {
    const { pattern } = rules;
    if (!pattern.value.test(value)) {
      return pattern.message;
    }
  }

  return undefined;
}

/**
 * Validates the entire profile form.
 * Returns errors object or null if valid.
 */
export function validateProfileForm(values: ProfileFormValues): ProfileFormErrors | null {
  const errors: ProfileFormErrors = {};
  const fields: ProfileFieldKey[] = [
    'firstName',
    'lastName',
    'phone',
    'street',
    'city',
    'state',
    'zipCode',
    'country',
  ];

  for (const field of fields) {
    const error = validateProfileField(field, values[field]);
    if (error) {
      errors[field] = error;
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

/**
 * Checks if the form has any errors.
 */
export function hasProfileFormErrors(errors: ProfileFormErrors): boolean {
  return Object.values(errors).some((error) => !!error);
}

/**
 * Creates initial form values from a user profile.
 */
export function profileToFormValues(profile: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}): ProfileFormValues {
  return {
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    phone: profile.phone ?? '',
    street: profile.address?.street ?? '',
    city: profile.address?.city ?? '',
    state: profile.address?.state ?? '',
    zipCode: profile.address?.zipCode ?? '',
    country: profile.address?.country ?? '',
  };
}

/**
 * Creates a profile update request from form values.
 */
export function formValuesToProfileUpdate(values: ProfileFormValues): {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
} {
  const hasAddress =
    values.street || values.city || values.state || values.zipCode || values.country;

  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    phone: values.phone.trim() || undefined,
    address: hasAddress
      ? {
          street: values.street.trim() || undefined,
          city: values.city.trim() || undefined,
          state: values.state.trim() || undefined,
          zipCode: values.zipCode.trim() || undefined,
          country: values.country.trim() || undefined,
        }
      : undefined,
  };
}
