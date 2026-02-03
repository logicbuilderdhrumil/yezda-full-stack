/**
 * Unit tests for profile validation utilities.
 * Task 1.7: Add tests for profile view, edit, and validation flows.
 */

import {
  validateProfileField,
  validateProfileForm,
  hasProfileFormErrors,
  profileToFormValues,
  formValuesToProfileUpdate,
} from '../utils/profileValidation';
import { ProfileFormValues, ProfileFormErrors, UserProfile } from '../types/profile.types';

describe('validateProfileField', () => {
  describe('firstName validation', () => {
    it('returns error for empty firstName', () => {
      const error = validateProfileField('firstName', '');
      expect(error).toBe('First name is required');
    });

    it('returns error for whitespace-only firstName', () => {
      const error = validateProfileField('firstName', '   ');
      expect(error).toBe('First name is required');
    });

    it('returns error for firstName exceeding max length', () => {
      const longName = 'a'.repeat(51);
      const error = validateProfileField('firstName', longName);
      expect(error).toBe('First name must be 50 characters or less');
    });

    it('returns undefined for valid firstName', () => {
      const error = validateProfileField('firstName', 'John');
      expect(error).toBeUndefined();
    });
  });

  describe('lastName validation', () => {
    it('returns error for empty lastName', () => {
      const error = validateProfileField('lastName', '');
      expect(error).toBe('Last name is required');
    });

    it('returns undefined for valid lastName', () => {
      const error = validateProfileField('lastName', 'Doe');
      expect(error).toBeUndefined();
    });
  });

  describe('phone validation', () => {
    it('returns undefined for empty phone (optional field)', () => {
      const error = validateProfileField('phone', '');
      expect(error).toBeUndefined();
    });

    it('returns error for short phone number', () => {
      const error = validateProfileField('phone', '12345');
      expect(error).toBe('Phone number must be at least 10 digits');
    });

    it('returns error for invalid phone pattern', () => {
      const error = validateProfileField('phone', 'abcdefghij');
      expect(error).toBe('Enter a valid phone number');
    });

    it('returns undefined for valid phone', () => {
      const error = validateProfileField('phone', '(555) 123-4567');
      expect(error).toBeUndefined();
    });

    it('returns undefined for valid international phone', () => {
      const error = validateProfileField('phone', '+1 555 123 4567');
      expect(error).toBeUndefined();
    });
  });

  describe('zipCode validation', () => {
    it('returns undefined for empty zipCode (optional field)', () => {
      const error = validateProfileField('zipCode', '');
      expect(error).toBeUndefined();
    });

    it('returns error for invalid zipCode format', () => {
      const error = validateProfileField('zipCode', 'ab');
      expect(error).toBe('Enter a valid postal code');
    });

    it('returns undefined for valid US zipCode', () => {
      const error = validateProfileField('zipCode', '12345');
      expect(error).toBeUndefined();
    });

    it('returns undefined for valid Canadian postal code', () => {
      const error = validateProfileField('zipCode', 'M5V 2T6');
      expect(error).toBeUndefined();
    });
  });

  describe('address fields validation', () => {
    it('returns undefined for empty optional fields', () => {
      expect(validateProfileField('street', '')).toBeUndefined();
      expect(validateProfileField('city', '')).toBeUndefined();
      expect(validateProfileField('state', '')).toBeUndefined();
      expect(validateProfileField('country', '')).toBeUndefined();
    });

    it('returns error for street exceeding max length', () => {
      const longStreet = 'a'.repeat(101);
      const error = validateProfileField('street', longStreet);
      expect(error).toBe('Street address must be 100 characters or less');
    });
  });
});

describe('validateProfileForm', () => {
  it('returns errors for invalid form with missing required fields', () => {
    const values: ProfileFormValues = {
      firstName: '',
      lastName: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    };
    const errors = validateProfileForm(values);

    expect(errors).toEqual({
      firstName: 'First name is required',
      lastName: 'Last name is required',
    });
  });

  it('returns null for valid form with required fields only', () => {
    const values: ProfileFormValues = {
      firstName: 'John',
      lastName: 'Doe',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    };
    const errors = validateProfileForm(values);

    expect(errors).toBeNull();
  });

  it('returns null for valid form with all fields', () => {
    const values: ProfileFormValues = {
      firstName: 'John',
      lastName: 'Doe',
      phone: '(555) 123-4567',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    };
    const errors = validateProfileForm(values);

    expect(errors).toBeNull();
  });

  it('returns errors for invalid optional fields', () => {
    const values: ProfileFormValues = {
      firstName: 'John',
      lastName: 'Doe',
      phone: '12345', // Too short
      street: '',
      city: '',
      state: '',
      zipCode: 'ab', // Invalid
      country: '',
    };
    const errors = validateProfileForm(values);

    expect(errors).toEqual({
      phone: 'Phone number must be at least 10 digits',
      zipCode: 'Enter a valid postal code',
    });
  });
});

describe('hasProfileFormErrors', () => {
  it('returns true when errors exist', () => {
    const errors: ProfileFormErrors = { firstName: 'Required' };
    expect(hasProfileFormErrors(errors)).toBe(true);
  });

  it('returns false for empty errors object', () => {
    const errors: ProfileFormErrors = {};
    expect(hasProfileFormErrors(errors)).toBe(false);
  });

  it('returns false when all values are undefined', () => {
    const errors: ProfileFormErrors = {
      firstName: undefined,
      lastName: undefined,
    };
    expect(hasProfileFormErrors(errors)).toBe(false);
  });
});

describe('profileToFormValues', () => {
  it('converts profile to form values with all fields', () => {
    const profile = {
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-1234',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      },
    };
    const result = profileToFormValues(profile);

    expect(result).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-1234',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    });
  });

  it('handles missing optional fields', () => {
    const profile = {
      firstName: 'John',
      lastName: 'Doe',
    };
    const result = profileToFormValues(profile);

    expect(result).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    });
  });

  it('handles empty profile', () => {
    const result = profileToFormValues({});

    expect(result).toEqual({
      firstName: '',
      lastName: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    });
  });
});

describe('formValuesToProfileUpdate', () => {
  it('converts form values to update request with all fields', () => {
    const values: ProfileFormValues = {
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-1234',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    };
    const result = formValuesToProfileUpdate(values);

    expect(result).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-1234',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      },
    });
  });

  it('omits address when all address fields are empty', () => {
    const values: ProfileFormValues = {
      firstName: 'John',
      lastName: 'Doe',
      phone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    };
    const result = formValuesToProfileUpdate(values);

    expect(result).toEqual({
      firstName: 'John',
      lastName: 'Doe',
      phone: undefined,
      address: undefined,
    });
  });

  it('trims whitespace from values', () => {
    const values: ProfileFormValues = {
      firstName: '  John  ',
      lastName: '  Doe  ',
      phone: '  555-1234  ',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    };
    const result = formValuesToProfileUpdate(values);

    expect(result.firstName).toBe('John');
    expect(result.lastName).toBe('Doe');
    expect(result.phone).toBe('555-1234');
  });

  it('includes partial address when some fields are filled', () => {
    const values: ProfileFormValues = {
      firstName: 'John',
      lastName: 'Doe',
      phone: '',
      street: '',
      city: 'New York',
      state: '',
      zipCode: '',
      country: '',
    };
    const result = formValuesToProfileUpdate(values);

    expect(result.address).toEqual({
      street: undefined,
      city: 'New York',
      state: undefined,
      zipCode: undefined,
      country: undefined,
    });
  });
});
