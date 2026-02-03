/**
 * Tests for application validation utilities.
 * Task 1.7: Add tests for form rendering, draft, and submission flows.
 */

import {
  validateField,
  validateSection,
  validateForm,
  hasErrors,
  getErrorSummary,
  getMissingRequiredFields,
} from '../utils/applicationValidation';
import { FormField, FormSection, FormValues } from '../types/application.types';

describe('applicationValidation', () => {
  describe('validateField', () => {
    it('returns error for required empty text field', () => {
      const field: FormField = {
        id: 'name',
        label: 'Name',
        type: 'text',
        required: true,
        order: 1,
      };

      expect(validateField(field, '')).toBe('Name is required');
      expect(validateField(field, undefined)).toBe('Name is required');
    });

    it('returns undefined for optional empty field', () => {
      const field: FormField = {
        id: 'nickname',
        label: 'Nickname',
        type: 'text',
        required: false,
        order: 1,
      };

      expect(validateField(field, '')).toBeUndefined();
      expect(validateField(field, undefined)).toBeUndefined();
    });

    it('validates email format', () => {
      const field: FormField = {
        id: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        order: 1,
      };

      expect(validateField(field, 'invalid')).toBe('Enter a valid email address');
      expect(validateField(field, 'test@example.com')).toBeUndefined();
    });

    it('validates phone format', () => {
      const field: FormField = {
        id: 'phone',
        label: 'Phone',
        type: 'phone',
        required: true,
        order: 1,
      };

      expect(validateField(field, '123')).toBe('Phone number must have at least 10 digits');
      expect(validateField(field, '1234567890')).toBeUndefined();
    });

    it('validates text field length constraints', () => {
      const field: FormField = {
        id: 'bio',
        label: 'Bio',
        type: 'text',
        required: false,
        order: 1,
        minLength: 5,
        maxLength: 10,
      };

      expect(validateField(field, 'hi')).toBe('Bio must be at least 5 characters');
      expect(validateField(field, 'hello world!')).toBe('Bio must be 10 characters or less');
      expect(validateField(field, 'hello')).toBeUndefined();
    });

    it('validates date fields', () => {
      const field: FormField = {
        id: 'dob',
        label: 'Date of Birth',
        type: 'date',
        required: true,
        order: 1,
        minDate: '2000-01-01',
        maxDate: '2025-12-31',
      };

      expect(validateField(field, 'invalid-date')).toBe('Enter a valid date');
      expect(validateField(field, '1999-01-01')).toBe('Date must be on or after 2000-01-01');
      expect(validateField(field, '2026-01-01')).toBe('Date must be on or before 2025-12-31');
      expect(validateField(field, '2020-06-15')).toBeUndefined();
    });

    it('validates select field options', () => {
      const field: FormField = {
        id: 'country',
        label: 'Country',
        type: 'select',
        required: true,
        order: 1,
        options: [
          { value: 'us', label: 'United States' },
          { value: 'ca', label: 'Canada' },
        ],
      };

      expect(validateField(field, 'invalid')).toBe('Country contains an invalid option');
      expect(validateField(field, 'us')).toBeUndefined();
    });

    it('validates radio field options', () => {
      const field: FormField = {
        id: 'gender',
        label: 'Gender',
        type: 'radio',
        required: true,
        order: 1,
        options: [
          { value: 'male', label: 'Male' },
          { value: 'female', label: 'Female' },
        ],
      };

      expect(validateField(field, 'other')).toBe('Gender contains an invalid option');
      expect(validateField(field, 'male')).toBeUndefined();
    });

    it('validates checkbox with required boolean', () => {
      const field: FormField = {
        id: 'terms',
        label: 'Accept Terms',
        type: 'checkbox',
        required: true,
        order: 1,
      };

      expect(validateField(field, false)).toBe('Accept Terms is required');
      expect(validateField(field, true)).toBeUndefined();
    });

    it('validates checkbox with options', () => {
      const field: FormField = {
        id: 'interests',
        label: 'Interests',
        type: 'checkbox',
        required: true,
        order: 1,
        options: [
          { value: 'sports', label: 'Sports' },
          { value: 'music', label: 'Music' },
        ],
      };

      expect(validateField(field, [])).toBe('Interests is required');
      expect(validateField(field, ['invalid'])).toBe('Interests contains an invalid option');
      expect(validateField(field, ['sports', 'music'])).toBeUndefined();
    });
  });

  describe('validateSection', () => {
    it('returns errors for all invalid fields in section', () => {
      const section: FormSection = {
        id: 'personal',
        title: 'Personal Info',
        order: 1,
        fields: [
          { id: 'name', label: 'Name', type: 'text', required: true, order: 1 },
          { id: 'email', label: 'Email', type: 'email', required: true, order: 2 },
        ],
      };

      const values: FormValues = { name: '', email: 'invalid' };
      const errors = validateSection(section, values);

      expect(errors.name).toBe('Name is required');
      expect(errors.email).toBe('Enter a valid email address');
    });

    it('returns empty object when all fields valid', () => {
      const section: FormSection = {
        id: 'personal',
        title: 'Personal Info',
        order: 1,
        fields: [
          { id: 'name', label: 'Name', type: 'text', required: true, order: 1 },
          { id: 'email', label: 'Email', type: 'email', required: true, order: 2 },
        ],
      };

      const values: FormValues = { name: 'John', email: 'john@example.com' };
      const errors = validateSection(section, values);

      expect(errors).toEqual({});
    });
  });

  describe('validateForm', () => {
    it('validates all sections and returns combined errors', () => {
      const sections: FormSection[] = [
        {
          id: 'personal',
          title: 'Personal Info',
          order: 1,
          fields: [
            { id: 'name', label: 'Name', type: 'text', required: true, order: 1 },
          ],
        },
        {
          id: 'contact',
          title: 'Contact Info',
          order: 2,
          fields: [
            { id: 'phone', label: 'Phone', type: 'phone', required: true, order: 1 },
          ],
        },
      ];

      const values: FormValues = { name: '', phone: '123' };
      const errors = validateForm(sections, values);

      expect(errors.name).toBe('Name is required');
      expect(errors.phone).toBe('Phone number must have at least 10 digits');
    });
  });

  describe('hasErrors', () => {
    it('returns true when errors exist', () => {
      expect(hasErrors({ name: 'Required' })).toBe(true);
    });

    it('returns false when no errors', () => {
      expect(hasErrors({})).toBe(false);
    });
  });

  describe('getErrorSummary', () => {
    it('returns empty string when no errors', () => {
      expect(getErrorSummary({})).toBe('');
    });

    it('returns singular message for one error', () => {
      expect(getErrorSummary({ name: 'Required' })).toBe('1 field has an error');
    });

    it('returns plural message for multiple errors', () => {
      expect(getErrorSummary({ name: 'Required', email: 'Invalid' })).toBe('2 fields have errors');
    });
  });

  describe('getMissingRequiredFields', () => {
    it('returns list of missing required field labels', () => {
      const sections: FormSection[] = [
        {
          id: 'personal',
          title: 'Personal Info',
          order: 1,
          fields: [
            { id: 'name', label: 'Full Name', type: 'text', required: true, order: 1 },
            { id: 'bio', label: 'Bio', type: 'textarea', required: false, order: 2 },
          ],
        },
      ];

      const values: FormValues = { bio: 'Hello' };
      const missing = getMissingRequiredFields(sections, values);

      expect(missing).toEqual(['Full Name']);
    });

    it('returns empty array when all required fields filled', () => {
      const sections: FormSection[] = [
        {
          id: 'personal',
          title: 'Personal Info',
          order: 1,
          fields: [
            { id: 'name', label: 'Full Name', type: 'text', required: true, order: 1 },
          ],
        },
      ];

      const values: FormValues = { name: 'John' };
      const missing = getMissingRequiredFields(sections, values);

      expect(missing).toEqual([]);
    });
  });
});
