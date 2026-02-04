/**
 * Dynamic form field components for application forms.
 * Task 1.3: Implement dynamic form renderer for supported field types.
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {
  FormField,
  TextField,
  TextareaField,
  DateField,
  SelectField,
  RadioField,
  CheckboxField,
} from '../../types/application.types';

interface FormFieldProps {
  field: FormField;
  value: string | string[] | boolean | undefined;
  error?: string;
  onChange: (value: string | string[] | boolean) => void;
  onBlur?: () => void;
  disabled?: boolean;
}

/**
 * Text input field component.
 */
function TextFieldComponent({
  field,
  value,
  error,
  onChange,
  onBlur,
  disabled,
}: FormFieldProps & { field: TextField }) {
  const keyboardType = field.type === 'email' ? 'email-address' : field.type === 'phone' ? 'phone-pad' : 'default';

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <Text className="text-red-500"> *</Text>}
      </Text>
      <TextInput
        className={`border rounded-lg px-4 py-3 text-base ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
        } ${disabled ? 'bg-gray-100' : ''}`}
        placeholder={field.placeholder}
        placeholderTextColor="#9CA3AF"
        value={typeof value === 'string' ? value : ''}
        onChangeText={(text) => onChange(text)}
        onBlur={onBlur}
        editable={!disabled}
        keyboardType={keyboardType}
        autoCapitalize={field.type === 'email' ? 'none' : 'sentences'}
        autoComplete={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'off'}
        autoCorrect={field.type !== 'email'}
        maxLength={field.maxLength}
        accessibilityLabel={field.label}
        accessibilityHint={field.helpText}
      />
      {field.helpText && !error && (
        <Text className="text-xs text-gray-500 mt-1">{field.helpText}</Text>
      )}
      {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
    </View>
  );
}

/**
 * Textarea field component.
 */
function TextareaFieldComponent({
  field,
  value,
  error,
  onChange,
  onBlur,
  disabled,
}: FormFieldProps & { field: TextareaField }) {
  const rows = field.rows || 4;

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <Text className="text-red-500"> *</Text>}
      </Text>
      <TextInput
        className={`border rounded-lg px-4 py-3 text-base ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
        } ${disabled ? 'bg-gray-100' : ''}`}
        placeholder={field.placeholder}
        placeholderTextColor="#9CA3AF"
        value={typeof value === 'string' ? value : ''}
        onChangeText={(text) => onChange(text)}
        onBlur={onBlur}
        editable={!disabled}
        multiline
        numberOfLines={rows}
        textAlignVertical="top"
        style={{ minHeight: rows * 24 }}
        maxLength={field.maxLength}
        accessibilityLabel={field.label}
        accessibilityHint={field.helpText}
      />
      {field.helpText && !error && (
        <Text className="text-xs text-gray-500 mt-1">{field.helpText}</Text>
      )}
      {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
      {field.maxLength && (
        <Text className="text-xs text-gray-400 mt-1 text-right">
          {(typeof value === 'string' ? value : '').length}/{field.maxLength}
        </Text>
      )}
    </View>
  );
}

/**
 * Date field component.
 */
function DateFieldComponent({
  field,
  value,
  error,
  onChange,
  onBlur,
  disabled,
}: FormFieldProps & { field: DateField }) {
  // Simple date input - in production would use DateTimePicker
  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <Text className="text-red-500"> *</Text>}
      </Text>
      <TextInput
        className={`border rounded-lg px-4 py-3 text-base ${
          error ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
        } ${disabled ? 'bg-gray-100' : ''}`}
        placeholder={field.placeholder || 'YYYY-MM-DD'}
        placeholderTextColor="#9CA3AF"
        value={typeof value === 'string' ? value : ''}
        onChangeText={(text) => onChange(text)}
        onBlur={onBlur}
        editable={!disabled}
        accessibilityLabel={field.label}
        accessibilityHint={field.helpText || 'Enter date in YYYY-MM-DD format'}
      />
      {field.helpText && !error && (
        <Text className="text-xs text-gray-500 mt-1">{field.helpText}</Text>
      )}
      {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
    </View>
  );
}

/**
 * Select field component.
 */
function SelectFieldComponent({
  field,
  value,
  error,
  onChange,
  disabled,
}: FormFieldProps & { field: SelectField }) {
  const selectedValue = typeof value === 'string' ? value : Array.isArray(value) ? value[0] : '';

  const handleSelect = useCallback(
    (optionValue: string) => {
      if (disabled) return;
      onChange(optionValue);
    },
    [onChange, disabled]
  );

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <Text className="text-red-500"> *</Text>}
      </Text>
      <View className="border rounded-lg overflow-hidden border-gray-300">
        {field.options.map((option, index) => (
          <TouchableOpacity
            key={option.value}
            className={`px-4 py-3 flex-row justify-between items-center ${
              index > 0 ? 'border-t border-gray-200' : ''
            } ${selectedValue === option.value ? 'bg-blue-50' : 'bg-white'} ${
              disabled ? 'opacity-50' : ''
            }`}
            onPress={() => handleSelect(option.value)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ checked: selectedValue === option.value }}
          >
            <Text className="text-base text-gray-900">{option.label}</Text>
            {selectedValue === option.value && (
              <View className="w-5 h-5 rounded-full bg-blue-600 items-center justify-center">
                <Text className="text-white text-xs">✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
      {field.helpText && !error && (
        <Text className="text-xs text-gray-500 mt-1">{field.helpText}</Text>
      )}
      {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
    </View>
  );
}

/**
 * Radio field component.
 */
function RadioFieldComponent({
  field,
  value,
  error,
  onChange,
  disabled,
}: FormFieldProps & { field: RadioField }) {
  const selectedValue = typeof value === 'string' ? value : '';

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-2">
        {field.label}
        {field.required && <Text className="text-red-500"> *</Text>}
      </Text>
      <View>
        {field.options.map((option) => (
          <TouchableOpacity
            key={option.value}
            className={`flex-row items-center py-2 ${disabled ? 'opacity-50' : ''}`}
            onPress={() => !disabled && onChange(option.value)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityState={{ checked: selectedValue === option.value }}
          >
            <View
              className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                selectedValue === option.value
                  ? 'border-blue-600'
                  : 'border-gray-400'
              }`}
            >
              {selectedValue === option.value && (
                <View className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              )}
            </View>
            <Text className="text-base text-gray-900">{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {field.helpText && !error && (
        <Text className="text-xs text-gray-500 mt-1">{field.helpText}</Text>
      )}
      {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
    </View>
  );
}

/**
 * Checkbox field component.
 */
function CheckboxFieldComponent({
  field,
  value,
  error,
  onChange,
  disabled,
}: FormFieldProps & { field: CheckboxField }) {
  // Single checkbox (boolean) or multiple (string[])
  const isMultiple = Boolean(field.options?.length);

  if (isMultiple && field.options) {
    const selectedValues = Array.isArray(value) ? value : [];

    const handleToggle = (optionValue: string) => {
      if (disabled) return;
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(newValues);
    };

    return (
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-2">
          {field.label}
          {field.required && <Text className="text-red-500"> *</Text>}
        </Text>
        <View>
          {field.options.map((option) => (
            <TouchableOpacity
              key={option.value}
              className={`flex-row items-center py-2 ${disabled ? 'opacity-50' : ''}`}
              onPress={() => handleToggle(option.value)}
              disabled={disabled}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selectedValues.includes(option.value) }}
            >
              <View
                className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
                  selectedValues.includes(option.value)
                    ? 'border-blue-600 bg-blue-600'
                    : 'border-gray-400 bg-white'
                }`}
              >
                {selectedValues.includes(option.value) && (
                  <Text className="text-white text-xs font-bold">✓</Text>
                )}
              </View>
              <Text className="text-base text-gray-900">{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {field.helpText && !error && (
          <Text className="text-xs text-gray-500 mt-1">{field.helpText}</Text>
        )}
        {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
      </View>
    );
  }

  // Single checkbox
  const isChecked = Boolean(value);

  return (
    <View className="mb-4">
      <TouchableOpacity
        className={`flex-row items-center py-2 ${disabled ? 'opacity-50' : ''}`}
        onPress={() => !disabled && onChange(!isChecked)}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isChecked }}
      >
        <View
          className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${
            isChecked ? 'border-blue-600 bg-blue-600' : 'border-gray-400 bg-white'
          }`}
        >
          {isChecked && <Text className="text-white text-xs font-bold">✓</Text>}
        </View>
        <Text className="text-base text-gray-900">
          {field.label}
          {field.required && <Text className="text-red-500"> *</Text>}
        </Text>
      </TouchableOpacity>
      {field.helpText && !error && (
        <Text className="text-xs text-gray-500 mt-1">{field.helpText}</Text>
      )}
      {error && <Text className="text-xs text-red-500 mt-1">{error}</Text>}
    </View>
  );
}

/**
 * Dynamic form field renderer.
 */
export function FormFieldRenderer(props: FormFieldProps) {
  const { field } = props;

  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
      return <TextFieldComponent {...props} field={field as TextField} />;
    case 'textarea':
      return <TextareaFieldComponent {...props} field={field as TextareaField} />;
    case 'date':
      return <DateFieldComponent {...props} field={field as DateField} />;
    case 'select':
      return <SelectFieldComponent {...props} field={field as SelectField} />;
    case 'radio':
      return <RadioFieldComponent {...props} field={field as RadioField} />;
    case 'checkbox':
      return <CheckboxFieldComponent {...props} field={field as CheckboxField} />;
    default:
      return null;
  }
}

export default FormFieldRenderer;
