/**
 * Unit tests for CandidateForm validation functions.
 */
import { describe, it, expect } from 'vitest';
import { validateForm } from '@/views/candidates/CandidateForm';

/**
 * Mock translation function that returns the key as-is.
 */
const mockT = (key: string): string => key;

describe('validateForm', () => {
  describe('email validation', () => {
    it('returns error when email is empty', () => {
      const errors = validateForm(
        { email: '', firstName: 'John', lastName: 'Doe' },
        mockT
      );
      expect(errors.email).toBe('candidates.form.validation.emailRequired');
    });

    it('returns error when email is whitespace only', () => {
      const errors = validateForm(
        { email: '   ', firstName: 'John', lastName: 'Doe' },
        mockT
      );
      expect(errors.email).toBe('candidates.form.validation.emailRequired');
    });

    it('returns error for invalid email format - missing @', () => {
      const errors = validateForm(
        { email: 'invalid-email', firstName: 'John', lastName: 'Doe' },
        mockT
      );
      expect(errors.email).toBe('candidates.form.validation.emailInvalid');
    });

    it('returns error for invalid email format - missing domain', () => {
      const errors = validateForm(
        { email: 'test@', firstName: 'John', lastName: 'Doe' },
        mockT
      );
      expect(errors.email).toBe('candidates.form.validation.emailInvalid');
    });

    it('returns error for invalid email format - missing TLD', () => {
      const errors = validateForm(
        { email: 'test@domain', firstName: 'John', lastName: 'Doe' },
        mockT
      );
      expect(errors.email).toBe('candidates.form.validation.emailInvalid');
    });

    it('returns no email error for valid email', () => {
      const errors = validateForm(
        { email: 'test@example.com', firstName: 'John', lastName: 'Doe' },
        mockT
      );
      expect(errors.email).toBeUndefined();
    });

    it('returns error for email with leading/trailing spaces (regex requires trimmed input)', () => {
      // Note: The validateForm function checks trim() for emptiness but validates the raw input
      // In practice, the form component should trim values before calling create
      const errors = validateForm(
        { email: ' test@example.com ', firstName: 'John', lastName: 'Doe' },
        mockT
      );
      expect(errors.email).toBe('candidates.form.validation.emailInvalid');
    });
  });

  describe('firstName validation', () => {
    it('returns error when firstName is empty', () => {
      const errors = validateForm(
        { email: 'test@example.com', firstName: '', lastName: 'Doe' },
        mockT
      );
      expect(errors.firstName).toBe('candidates.form.validation.firstNameRequired');
    });

    it('returns error when firstName is whitespace only', () => {
      const errors = validateForm(
        { email: 'test@example.com', firstName: '   ', lastName: 'Doe' },
        mockT
      );
      expect(errors.firstName).toBe('candidates.form.validation.firstNameRequired');
    });

    it('returns no firstName error for valid firstName', () => {
      const errors = validateForm(
        { email: 'test@example.com', firstName: 'John', lastName: 'Doe' },
        mockT
      );
      expect(errors.firstName).toBeUndefined();
    });

    it('returns no firstName error when firstName has leading/trailing spaces', () => {
      const errors = validateForm(
        { email: 'test@example.com', firstName: ' John ', lastName: 'Doe' },
        mockT
      );
      expect(errors.firstName).toBeUndefined();
    });
  });

  describe('lastName validation', () => {
    it('returns error when lastName is empty', () => {
      const errors = validateForm(
        { email: 'test@example.com', firstName: 'John', lastName: '' },
        mockT
      );
      expect(errors.lastName).toBe('candidates.form.validation.lastNameRequired');
    });

    it('returns error when lastName is whitespace only', () => {
      const errors = validateForm(
        { email: 'test@example.com', firstName: 'John', lastName: '   ' },
        mockT
      );
      expect(errors.lastName).toBe('candidates.form.validation.lastNameRequired');
    });

    it('returns no lastName error for valid lastName', () => {
      const errors = validateForm(
        { email: 'test@example.com', firstName: 'John', lastName: 'Doe' },
        mockT
      );
      expect(errors.lastName).toBeUndefined();
    });
  });

  describe('combined validation', () => {
    it('returns no errors when all fields are valid', () => {
      const errors = validateForm(
        { email: 'test@example.com', firstName: 'John', lastName: 'Doe' },
        mockT
      );
      expect(errors.email).toBeUndefined();
      expect(errors.firstName).toBeUndefined();
      expect(errors.lastName).toBeUndefined();
    });

    it('returns all errors when all fields are invalid', () => {
      const errors = validateForm(
        { email: '', firstName: '', lastName: '' },
        mockT
      );
      expect(errors.email).toBe('candidates.form.validation.emailRequired');
      expect(errors.firstName).toBe('candidates.form.validation.firstNameRequired');
      expect(errors.lastName).toBe('candidates.form.validation.lastNameRequired');
    });

    it('handles undefined fields', () => {
      const errors = validateForm({}, mockT);
      expect(errors.email).toBe('candidates.form.validation.emailRequired');
      expect(errors.firstName).toBe('candidates.form.validation.firstNameRequired');
      expect(errors.lastName).toBe('candidates.form.validation.lastNameRequired');
    });

    it('handles missing email property', () => {
      const errors = validateForm(
        { firstName: 'John', lastName: 'Doe' },
        mockT
      );
      expect(errors.email).toBe('candidates.form.validation.emailRequired');
    });
  });

  describe('edge cases', () => {
    it('handles email with special characters correctly', () => {
      const errors = validateForm(
        { email: 'user+tag@example.com', firstName: 'John', lastName: 'Doe' },
        mockT
      );
      expect(errors.email).toBeUndefined();
    });

    it('handles email with subdomain', () => {
      const errors = validateForm(
        { email: 'test@mail.example.com', firstName: 'John', lastName: 'Doe' },
        mockT
      );
      expect(errors.email).toBeUndefined();
    });

    it('handles names with hyphens', () => {
      const errors = validateForm(
        { email: 'test@example.com', firstName: 'Mary-Jane', lastName: 'Doe-Smith' },
        mockT
      );
      expect(errors.firstName).toBeUndefined();
      expect(errors.lastName).toBeUndefined();
    });

    it('handles single character names', () => {
      const errors = validateForm(
        { email: 'test@example.com', firstName: 'J', lastName: 'D' },
        mockT
      );
      expect(errors.firstName).toBeUndefined();
      expect(errors.lastName).toBeUndefined();
    });
  });
});
