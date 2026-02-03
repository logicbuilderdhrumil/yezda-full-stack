/**
 * Profile edit form with field validation and save states.
 * Task 1.3: Build profile edit form with field validation and save states.
 * Task 1.5: Integrate profile update API call with optimistic feedback.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  useProfileStore,
  selectProfile,
  selectProfileScreenState,
  selectProfileError,
  selectProfileSuccess,
} from '../store/profileStore';
import { ProfileFormValues, ProfileFormErrors } from '../types/profile.types';
import {
  validateProfileField,
  validateProfileForm,
  profileToFormValues,
  formValuesToProfileUpdate,
} from '../utils/profileValidation';

interface ProfileEditScreenProps {
  onSaveSuccess?: () => void;
  onCancel?: () => void;
}

export function ProfileEditScreen({
  onSaveSuccess,
  onCancel,
}: ProfileEditScreenProps) {
  const profile = useProfileStore(selectProfile);
  const screenState = useProfileStore(selectProfileScreenState);
  const error = useProfileStore(selectProfileError);
  const successMessage = useProfileStore(selectProfileSuccess);
  const updateProfile = useProfileStore((state) => state.updateProfile);
  const clearError = useProfileStore((state) => state.clearError);
  const clearSuccess = useProfileStore((state) => state.clearSuccess);

  const [formValues, setFormValues] = useState<ProfileFormValues>(() =>
    profileToFormValues(profile ?? {})
  );
  const [formErrors, setFormErrors] = useState<ProfileFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const isSaving = screenState === 'saving';
  const isSuccess = screenState === 'success';

  // Reset form when profile changes
  useEffect(() => {
    if (profile) {
      setFormValues(profileToFormValues(profile));
    }
  }, [profile]);

  // Handle success - navigate back
  useEffect(() => {
    if (isSuccess && successMessage && onSaveSuccess) {
      // Allow success message to show briefly before navigating
      const timer = setTimeout(() => {
        clearSuccess();
        onSaveSuccess();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isSuccess, successMessage, onSaveSuccess, clearSuccess]);

  const handleChange = useCallback(
    (field: keyof ProfileFormValues) => (value: string) => {
      setFormValues((prev) => ({ ...prev, [field]: value }));

      // Clear field error on change if touched
      if (touched[field]) {
        const fieldError = validateProfileField(field, value);
        setFormErrors((prev) => ({ ...prev, [field]: fieldError }));
      }

      // Clear general error when user starts typing
      if (error) {
        clearError();
      }
    },
    [touched, error, clearError]
  );

  const handleBlur = useCallback(
    (field: keyof ProfileFormValues) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const fieldError = validateProfileField(field, formValues[field]);
      setFormErrors((prev) => ({ ...prev, [field]: fieldError }));
    },
    [formValues]
  );

  const handleSubmit = useCallback(async () => {
    if (isSaving) return;

    // Mark required fields as touched
    setTouched({
      firstName: true,
      lastName: true,
      phone: true,
      street: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
    });

    // Validate form
    const errors = validateProfileForm(formValues);
    if (errors) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    const updateData = formValuesToProfileUpdate(formValues);
    await updateProfile(updateData);
  }, [formValues, updateProfile, isSaving]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50"
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-8"
        keyboardShouldPersistTaps="handled"
      >
        {/* Success Banner */}
        {successMessage && (
          <View
            className="bg-green-50 border-b border-green-200 p-4"
            accessibilityRole="alert"
          >
            <Text className="text-green-700 text-sm text-center">
              {successMessage}
            </Text>
          </View>
        )}

        {/* Error Banner */}
        {error && (
          <View
            className="bg-red-50 border-b border-red-200 p-4"
            accessibilityRole="alert"
          >
            <Text className="text-red-700 text-sm text-center">{error}</Text>
          </View>
        )}

        {/* Personal Information Section */}
        <View className="bg-white mt-4 px-6 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Personal Information
          </Text>

          <FormField
            label="First Name"
            value={formValues.firstName}
            onChangeText={handleChange('firstName')}
            onBlur={handleBlur('firstName')}
            error={formErrors.firstName}
            touched={touched.firstName}
            disabled={isSaving}
            required
            autoCapitalize="words"
          />

          <FormField
            label="Last Name"
            value={formValues.lastName}
            onChangeText={handleChange('lastName')}
            onBlur={handleBlur('lastName')}
            error={formErrors.lastName}
            touched={touched.lastName}
            disabled={isSaving}
            required
            autoCapitalize="words"
          />

          <FormField
            label="Phone"
            value={formValues.phone}
            onChangeText={handleChange('phone')}
            onBlur={handleBlur('phone')}
            error={formErrors.phone}
            touched={touched.phone}
            disabled={isSaving}
            keyboardType="phone-pad"
            placeholder="(555) 123-4567"
          />
        </View>

        {/* Address Section */}
        <View className="bg-white mt-4 px-6 py-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Address
          </Text>

          <FormField
            label="Street Address"
            value={formValues.street}
            onChangeText={handleChange('street')}
            onBlur={handleBlur('street')}
            error={formErrors.street}
            touched={touched.street}
            disabled={isSaving}
            placeholder="123 Main St"
          />

          <FormField
            label="City"
            value={formValues.city}
            onChangeText={handleChange('city')}
            onBlur={handleBlur('city')}
            error={formErrors.city}
            touched={touched.city}
            disabled={isSaving}
            autoCapitalize="words"
          />

          <View className="flex-row">
            <View className="flex-1 mr-2">
              <FormField
                label="State"
                value={formValues.state}
                onChangeText={handleChange('state')}
                onBlur={handleBlur('state')}
                error={formErrors.state}
                touched={touched.state}
                disabled={isSaving}
                autoCapitalize="characters"
              />
            </View>
            <View className="flex-1 ml-2">
              <FormField
                label="ZIP Code"
                value={formValues.zipCode}
                onChangeText={handleChange('zipCode')}
                onBlur={handleBlur('zipCode')}
                error={formErrors.zipCode}
                touched={touched.zipCode}
                disabled={isSaving}
                keyboardType="default"
              />
            </View>
          </View>

          <FormField
            label="Country"
            value={formValues.country}
            onChangeText={handleChange('country')}
            onBlur={handleBlur('country')}
            error={formErrors.country}
            touched={touched.country}
            disabled={isSaving}
            autoCapitalize="words"
          />
        </View>

        {/* Action Buttons */}
        <View className="px-6 mt-6 space-y-3">
          <TouchableOpacity
            className={`py-4 rounded-lg ${
              isSaving ? 'bg-blue-400' : 'bg-blue-600'
            }`}
            onPress={handleSubmit}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Save changes"
            accessibilityState={{ disabled: isSaving }}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                Save Changes
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="py-4 rounded-lg mt-3 bg-gray-100"
            onPress={onCancel}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel="Cancel editing"
          >
            <Text className="text-gray-700 text-center font-semibold text-base">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur: () => void;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

function FormField({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  touched,
  disabled = false,
  required = false,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: FormFieldProps) {
  const showError = error && touched;

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <Text className="text-red-500"> *</Text>}
      </Text>
      <TextInput
        className={`border rounded-lg px-4 py-3 text-base ${
          showError
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 bg-white'
        } ${disabled ? 'opacity-50' : ''}`}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        editable={!disabled}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        accessibilityLabel={label}
        accessibilityHint={required ? 'Required field' : undefined}
      />
      {showError && (
        <Text className="text-red-500 text-xs mt-1">{error}</Text>
      )}
    </View>
  );
}

export default ProfileEditScreen;
