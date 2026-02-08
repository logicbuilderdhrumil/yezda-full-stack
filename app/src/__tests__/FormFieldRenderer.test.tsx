/**
 * Tests for FormFieldRenderer component.
 * Tests each field type renders correctly with proper accessibility and callbacks.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FormFieldRenderer } from '../screens/components/FormFieldRenderer';
import type { FormField } from '../types/application.types';

describe('FormFieldRenderer', () => {
  describe('TextField', () => {
    const textField: FormField = {
      id: 'name',
      type: 'text',
      label: 'Full Name',
      placeholder: 'Enter your name',
      required: true,
      order: 1,
      helpText: 'Enter your legal name',
    };

    it('renders text field with label and placeholder', () => {
      const { getByText, getByPlaceholderText } = render(
        <FormFieldRenderer
          field={textField}
          value=""
          onChange={jest.fn()}
        />
      );

      expect(getByText(/Full Name/)).toBeTruthy();
      expect(getByText('*')).toBeTruthy(); // Required indicator
      expect(getByPlaceholderText('Enter your name')).toBeTruthy();
    });

    it('displays help text when no error', () => {
      const { getByText } = render(
        <FormFieldRenderer
          field={textField}
          value=""
          onChange={jest.fn()}
        />
      );

      expect(getByText('Enter your legal name')).toBeTruthy();
    });

    it('displays error state and hides help text', () => {
      const { getByText, queryByText } = render(
        <FormFieldRenderer
          field={textField}
          value=""
          error="Name is required"
          onChange={jest.fn()}
        />
      );

      expect(getByText('Name is required')).toBeTruthy();
      expect(queryByText('Enter your legal name')).toBeNull();
    });

    it('calls onChange when text changes', () => {
      const mockOnChange = jest.fn();
      const { getByPlaceholderText } = render(
        <FormFieldRenderer
          field={textField}
          value=""
          onChange={mockOnChange}
        />
      );

      fireEvent.changeText(getByPlaceholderText('Enter your name'), 'John Doe');
      expect(mockOnChange).toHaveBeenCalledWith('John Doe');
    });

    it('calls onBlur when field loses focus', () => {
      const mockOnBlur = jest.fn();
      const { getByPlaceholderText } = render(
        <FormFieldRenderer
          field={textField}
          value=""
          onChange={jest.fn()}
          onBlur={mockOnBlur}
        />
      );

      fireEvent(getByPlaceholderText('Enter your name'), 'blur');
      expect(mockOnBlur).toHaveBeenCalled();
    });

    it('has correct accessibility label', () => {
      const { getByLabelText } = render(
        <FormFieldRenderer
          field={textField}
          value=""
          onChange={jest.fn()}
        />
      );

      expect(getByLabelText('Full Name')).toBeTruthy();
    });

    it('is disabled when disabled prop is true', () => {
      const mockOnChange = jest.fn();
      const { getByPlaceholderText } = render(
        <FormFieldRenderer
          field={textField}
          value=""
          onChange={mockOnChange}
          disabled
        />
      );

      const input = getByPlaceholderText('Enter your name');
      expect(input.props.editable).toBe(false);
    });
  });

  describe('TextareaField', () => {
    const textareaField: FormField = {
      id: 'bio',
      type: 'textarea',
      label: 'Biography',
      placeholder: 'Tell us about yourself',
      required: false,
      order: 1,
      rows: 4,
      maxLength: 500,
    };

    it('renders textarea with character count', () => {
      const { getByText } = render(
        <FormFieldRenderer
          field={textareaField}
          value="Hello"
          onChange={jest.fn()}
        />
      );

      expect(getByText(/Biography/)).toBeTruthy();
      expect(getByText('5/500')).toBeTruthy();
    });

    it('updates character count as text changes', () => {
      const { rerender, getByText } = render(
        <FormFieldRenderer
          field={textareaField}
          value=""
          onChange={jest.fn()}
        />
      );

      expect(getByText('0/500')).toBeTruthy();

      rerender(
        <FormFieldRenderer
          field={textareaField}
          value="Hello world"
          onChange={jest.fn()}
        />
      );

      expect(getByText('11/500')).toBeTruthy();
    });
  });

  describe('DateField', () => {
    const dateField: FormField = {
      id: 'birthdate',
      type: 'date',
      label: 'Date of Birth',
      required: true,
      order: 1,
    };

    it('renders date field with YYYY-MM-DD placeholder', () => {
      const { getByText, getByPlaceholderText } = render(
        <FormFieldRenderer
          field={dateField}
          value=""
          onChange={jest.fn()}
        />
      );

      expect(getByText(/Date of Birth/)).toBeTruthy();
      expect(getByPlaceholderText('YYYY-MM-DD')).toBeTruthy();
    });

    it('has accessibility hint for date format', () => {
      const { getByLabelText } = render(
        <FormFieldRenderer
          field={dateField}
          value=""
          onChange={jest.fn()}
        />
      );

      const input = getByLabelText('Date of Birth');
      expect(input.props.accessibilityHint).toBe('Enter date in YYYY-MM-DD format');
    });
  });

  describe('SelectField', () => {
    const selectField: FormField = {
      id: 'country',
      type: 'select',
      label: 'Country',
      required: true,
      order: 1,
      options: [
        { value: 'us', label: 'United States' },
        { value: 'ca', label: 'Canada' },
        { value: 'uk', label: 'United Kingdom' },
      ],
    };

    it('renders all options', () => {
      const { getByText } = render(
        <FormFieldRenderer
          field={selectField}
          value=""
          onChange={jest.fn()}
        />
      );

      expect(getByText(/Country/)).toBeTruthy();
      expect(getByText('United States')).toBeTruthy();
      expect(getByText('Canada')).toBeTruthy();
      expect(getByText('United Kingdom')).toBeTruthy();
    });

    it('calls onChange when option is selected', () => {
      const mockOnChange = jest.fn();
      const { getByText } = render(
        <FormFieldRenderer
          field={selectField}
          value=""
          onChange={mockOnChange}
        />
      );

      fireEvent.press(getByText('Canada'));
      expect(mockOnChange).toHaveBeenCalledWith('ca');
    });

    it('shows checkmark for selected option', () => {
      const { getByRole } = render(
        <FormFieldRenderer
          field={selectField}
          value="us"
          onChange={jest.fn()}
        />
      );

      const usOption = getByRole('radio', { name: 'United States' });
      expect(usOption.props.accessibilityState.checked).toBe(true);
    });
  });

  describe('RadioField', () => {
    const radioField: FormField = {
      id: 'gender',
      type: 'radio',
      label: 'Gender',
      required: false,
      order: 1,
      options: [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
      ],
    };

    it('renders all radio options', () => {
      const { getByText } = render(
        <FormFieldRenderer
          field={radioField}
          value=""
          onChange={jest.fn()}
        />
      );

      expect(getByText(/Gender/)).toBeTruthy();
      expect(getByText('Male')).toBeTruthy();
      expect(getByText('Female')).toBeTruthy();
      expect(getByText('Other')).toBeTruthy();
    });

    it('calls onChange when radio option is pressed', () => {
      const mockOnChange = jest.fn();
      const { getByText } = render(
        <FormFieldRenderer
          field={radioField}
          value=""
          onChange={mockOnChange}
        />
      );

      fireEvent.press(getByText('Female'));
      expect(mockOnChange).toHaveBeenCalledWith('female');
    });

    it('has correct accessibility role and state', () => {
      const { getByRole } = render(
        <FormFieldRenderer
          field={radioField}
          value="male"
          onChange={jest.fn()}
        />
      );

      const maleOption = getByRole('radio', { name: 'Male' });
      expect(maleOption.props.accessibilityState.checked).toBe(true);
    });
  });

  describe('CheckboxField - Single', () => {
    const singleCheckbox: FormField = {
      id: 'terms',
      type: 'checkbox',
      label: 'I agree to the terms and conditions',
      required: true,
      order: 1,
    };

    it('renders single checkbox', () => {
      const { getByText } = render(
        <FormFieldRenderer
          field={singleCheckbox}
          value={false}
          onChange={jest.fn()}
        />
      );

      expect(getByText(/I agree to the terms and conditions/)).toBeTruthy();
    });

    it('toggles checkbox value', () => {
      const mockOnChange = jest.fn();
      const { getByRole } = render(
        <FormFieldRenderer
          field={singleCheckbox}
          value={false}
          onChange={mockOnChange}
        />
      );

      fireEvent.press(getByRole('checkbox'));
      expect(mockOnChange).toHaveBeenCalledWith(true);
    });

    it('has correct accessibility state', () => {
      const { getByRole, rerender } = render(
        <FormFieldRenderer
          field={singleCheckbox}
          value={false}
          onChange={jest.fn()}
        />
      );

      expect(getByRole('checkbox').props.accessibilityState.checked).toBe(false);

      rerender(
        <FormFieldRenderer
          field={singleCheckbox}
          value={true}
          onChange={jest.fn()}
        />
      );

      expect(getByRole('checkbox').props.accessibilityState.checked).toBe(true);
    });
  });

  describe('CheckboxField - Multiple', () => {
    const multiCheckbox: FormField = {
      id: 'skills',
      type: 'checkbox',
      label: 'Skills',
      required: false,
      order: 1,
      options: [
        { value: 'js', label: 'JavaScript' },
        { value: 'ts', label: 'TypeScript' },
        { value: 'react', label: 'React' },
      ],
    };

    it('renders all checkbox options', () => {
      const { getByText } = render(
        <FormFieldRenderer
          field={multiCheckbox}
          value={[]}
          onChange={jest.fn()}
        />
      );

      expect(getByText(/Skills/)).toBeTruthy();
      expect(getByText('JavaScript')).toBeTruthy();
      expect(getByText('TypeScript')).toBeTruthy();
      expect(getByText('React')).toBeTruthy();
    });

    it('toggles selected options correctly', () => {
      const mockOnChange = jest.fn();
      const { getByText } = render(
        <FormFieldRenderer
          field={multiCheckbox}
          value={['js']}
          onChange={mockOnChange}
        />
      );

      // Add TypeScript
      fireEvent.press(getByText('TypeScript'));
      expect(mockOnChange).toHaveBeenCalledWith(['js', 'ts']);
    });

    it('removes option when already selected', () => {
      const mockOnChange = jest.fn();
      const { getByText } = render(
        <FormFieldRenderer
          field={multiCheckbox}
          value={['js', 'ts']}
          onChange={mockOnChange}
        />
      );

      // Remove JavaScript
      fireEvent.press(getByText('JavaScript'));
      expect(mockOnChange).toHaveBeenCalledWith(['ts']);
    });

    it('has correct accessibility states for each option', () => {
      const { getAllByRole } = render(
        <FormFieldRenderer
          field={multiCheckbox}
          value={['js', 'react']}
          onChange={jest.fn()}
        />
      );

      const checkboxes = getAllByRole('checkbox');
      // JS checked
      expect(checkboxes[0].props.accessibilityState.checked).toBe(true);
      // TS not checked
      expect(checkboxes[1].props.accessibilityState.checked).toBe(false);
      // React checked
      expect(checkboxes[2].props.accessibilityState.checked).toBe(true);
    });
  });

  describe('Error display', () => {
    const textField: FormField = {
      id: 'email',
      type: 'email',
      label: 'Email',
      required: true,
      order: 1,
    };

    it('displays error message', () => {
      const { getByText } = render(
        <FormFieldRenderer
          field={textField}
          value=""
          error="Valid email is required"
          onChange={jest.fn()}
        />
      );

      expect(getByText('Valid email is required')).toBeTruthy();
    });

    it('hides help text when error is shown', () => {
      const fieldWithHelp: FormField = {
        ...textField,
        helpText: 'We will send updates here',
      };

      const { queryByText, getByText } = render(
        <FormFieldRenderer
          field={fieldWithHelp}
          value=""
          error="Invalid email"
          onChange={jest.fn()}
        />
      );

      expect(getByText('Invalid email')).toBeTruthy();
      expect(queryByText('We will send updates here')).toBeNull();
    });
  });

  describe('Disabled state', () => {
    const textField: FormField = {
      id: 'readonly',
      type: 'text',
      label: 'Read Only Field',
      required: false,
      order: 1,
    };

    it('prevents interaction when disabled', () => {
      const mockOnChange = jest.fn();
      const { getByLabelText } = render(
        <FormFieldRenderer
          field={textField}
          value="Cannot edit"
          onChange={mockOnChange}
          disabled
        />
      );

      const input = getByLabelText('Read Only Field');
      expect(input.props.editable).toBe(false);
    });
  });

  describe('Unknown field type', () => {
    it('returns null for unsupported field types', () => {
      const unknownField = {
        id: 'unknown',
        type: 'unsupported' as any,
        label: 'Unknown',
        required: false,
        order: 1,
      } as any;

      const { toJSON } = render(
        <FormFieldRenderer
          field={unknownField}
          value=""
          onChange={jest.fn()}
        />
      );

      expect(toJSON()).toBeNull();
    });
  });
});
