/**
 * Profile types for account profile management.
 * Task 1.1: Define profile fields, validation rules, and error copy.
 */

/** User profile data structure */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: ProfileAddress;
}

/** Profile address structure */
export interface ProfileAddress {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

/** Profile form field values for editing */
export interface ProfileFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/** Profile form field errors */
export interface ProfileFormErrors {
  firstName?: string;
  lastName?: string;
  phone?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  general?: string;
}

/** Validation rules for profile form */
export const profileValidationRules = {
  firstName: {
    required: 'First name is required',
    maxLength: {
      value: 50,
      message: 'First name must be 50 characters or less',
    },
  },
  lastName: {
    required: 'Last name is required',
    maxLength: {
      value: 50,
      message: 'Last name must be 50 characters or less',
    },
  },
  phone: {
    required: false,
    pattern: {
      value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
      message: 'Enter a valid phone number',
    },
    minLength: {
      value: 10,
      message: 'Phone number must be at least 10 digits',
    },
  },
  street: {
    required: false,
    maxLength: {
      value: 100,
      message: 'Street address must be 100 characters or less',
    },
  },
  city: {
    required: false,
    maxLength: {
      value: 50,
      message: 'City must be 50 characters or less',
    },
  },
  state: {
    required: false,
    maxLength: {
      value: 50,
      message: 'State must be 50 characters or less',
    },
  },
  zipCode: {
    required: false,
    pattern: {
      value: /^[0-9A-Za-z\s-]{3,10}$/,
      message: 'Enter a valid postal code',
    },
  },
  country: {
    required: false,
    maxLength: {
      value: 50,
      message: 'Country must be 50 characters or less',
    },
  },
} as const;

/** Error copy for common profile operations */
export const profileErrorMessages = {
  loadFailed: 'Unable to load profile. Please try again.',
  saveFailed: 'Unable to save changes. Please try again.',
  networkError: 'Connection failed. Check your network and try again.',
  validationFailed: 'Please correct the errors before saving.',
  unknownError: 'An unexpected error occurred. Please try again later.',
} as const;

/** UI states for profile screens */
export type ProfileScreenState = 'idle' | 'loading' | 'saving' | 'error' | 'success';

/** Profile update request payload */
export interface ProfileUpdateRequest {
  firstName: string;
  lastName: string;
  phone?: string;
  address?: ProfileAddress;
}

/** Profile API response */
export interface ProfileResponse {
  profile: UserProfile;
}

/** Profile update response */
export interface ProfileUpdateResponse {
  profile: UserProfile;
  message?: string;
}
