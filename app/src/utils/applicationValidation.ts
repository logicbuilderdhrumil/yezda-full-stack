/**
 * Application form validation utilities.
 * Task 1.4: Implement field-level validation and error summaries.
 */

import {
  FormField,
  FormValues,
  FormErrors,
  FormSection,
  FieldType,
} from '../types/application.types';

/**
 * Validate a single field value.
 */
export function validateField(field: FormField, value: string | string[] | boolean | undefined): string | undefined {
  // Check if value is empty based on type
  const isEmpty = value === undefined || 
    value === '' || 
    (Array.isArray(value) && value.length === 0) ||
    // For checkboxes without options, false means not checked (empty)
    (field.type === 'checkbox' && typeof value === 'boolean' && !value);

  // Required check
  if (field.required && isEmpty) {
    return `${field.label} is required`;
  }

  // Skip other validations if empty and not required
  if (isEmpty) {
    return undefined;
  }

  // Type-specific validation
  switch (field.type) {
    case 'text':
      return validateTextField(field, value as string);
    case 'email':
      return validateEmailField(field, value as string);
    case 'phone':
      return validatePhoneField(field, value as string);
    case 'textarea':
      return validateTextareaField(field, value as string);
    case 'date':
      return validateDateField(field, value as string);
    case 'select':
      return validateSelectField(field, value as string | string[]);
    case 'radio':
      return validateRadioField(field, value as string);
    case 'checkbox':
      return validateCheckboxField(field, value as boolean | string[]);
    default:
      return undefined;
  }
}

/**
 * Validate text field.
 */
function validateTextField(field: { label: string; minLength?: number; maxLength?: number; pattern?: string }, value: string): string | undefined {
  if (field.minLength && value.length < field.minLength) {
    return `${field.label} must be at least ${field.minLength} characters`;
  }
  if (field.maxLength && value.length > field.maxLength) {
    return `${field.label} must be ${field.maxLength} characters or less`;
  }
  if (field.pattern) {
    const regex = new RegExp(field.pattern);
    if (!regex.test(value)) {
      return `${field.label} format is invalid`;
    }
  }
  return undefined;
}

/**
 * Validate email field.
 */
function validateEmailField(field: { label: string }, value: string): string | undefined {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Enter a valid email address';
  }
  return undefined;
}

/**
 * Validate phone field.
 */
function validatePhoneField(field: { label: string }, value: string): string | undefined {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
  if (!phoneRegex.test(value)) {
    return 'Enter a valid phone number';
  }
  if (value.replace(/\D/g, '').length < 10) {
    return 'Phone number must have at least 10 digits';
  }
  return undefined;
}

/**
 * Validate textarea field.
 */
function validateTextareaField(field: { label: string; maxLength?: number }, value: string): string | undefined {
  if (field.maxLength && value.length > field.maxLength) {
    return `${field.label} must be ${field.maxLength} characters or less`;
  }
  return undefined;
}

/**
 * Validate date field.
 */
function validateDateField(field: { label: string; minDate?: string; maxDate?: string }, value: string): string | undefined {
  const dateValue = new Date(value);
  if (isNaN(dateValue.getTime())) {
    return 'Enter a valid date';
  }

  if (field.minDate) {
    const minDate = new Date(field.minDate);
    if (dateValue < minDate) {
      return `Date must be on or after ${field.minDate}`;
    }
  }

  if (field.maxDate) {
    const maxDate = new Date(field.maxDate);
    if (dateValue > maxDate) {
      return `Date must be on or before ${field.maxDate}`;
    }
  }

  return undefined;
}

/**
 * Validate select field.
 */
function validateSelectField(field: { label: string; options?: { value: string }[]; multiple?: boolean }, value: string | string[]): string | undefined {
  if (!field.options) return undefined;
  const values = Array.isArray(value) ? value : [value];
  const validValues = field.options.map((opt) => opt.value);

  for (const v of values) {
    if (!validValues.includes(v)) {
      return `${field.label} contains an invalid option`;
    }
  }

  return undefined;
}

/**
 * Validate radio field.
 */
function validateRadioField(field: { label: string; options?: { value: string }[] }, value: string): string | undefined {
  if (!field.options) return undefined;
  const validValues = field.options.map((opt) => opt.value);
  if (!validValues.includes(value)) {
    return `${field.label} contains an invalid option`;
  }
  return undefined;
}

/**
 * Validate checkbox field.
 */
function validateCheckboxField(field: { label: string; options?: { value: string }[] }, value: boolean | string[]): string | undefined {
  // For checkboxes with options, validate selected values
  if (field.options && Array.isArray(value)) {
    const validValues = field.options.map((opt) => opt.value);
    for (const v of value) {
      if (!validValues.includes(v)) {
        return `${field.label} contains an invalid option`;
      }
    }
  }
  return undefined;
}

/**
 * Validate all fields in a section.
 */
export function validateSection(section: FormSection, values: FormValues): FormErrors {
  const errors: FormErrors = {};

  for (const field of section.fields) {
    const value = values[field.id];
    const error = validateField(field, value);
    if (error) {
      errors[field.id] = error;
    }
  }

  return errors;
}

/**
 * Validate all fields in all sections.
 */
export function validateForm(sections: FormSection[], values: FormValues): FormErrors {
  const errors: FormErrors = {};

  for (const section of sections) {
    const sectionErrors = validateSection(section, values);
    Object.assign(errors, sectionErrors);
  }

  return errors;
}

/**
 * Check if form has any errors.
 */
export function hasErrors(errors: FormErrors): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Get summary of error count.
 */
export function getErrorSummary(errors: FormErrors): string {
  const count = Object.keys(errors).length;
  if (count === 0) {
    return '';
  }
  if (count === 1) {
    return '1 field has an error';
  }
  return `${count} fields have errors`;
}

/**
 * Get list of required fields that are empty.
 */
export function getMissingRequiredFields(sections: FormSection[], values: FormValues): string[] {
  const missing: string[] = [];

  for (const section of sections) {
    for (const field of section.fields) {
      if (field.required) {
        const value = values[field.id];
        const isEmpty = value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
        if (isEmpty) {
          missing.push(field.label);
        }
      }
    }
  }

  return missing;
}
