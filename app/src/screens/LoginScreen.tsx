/**
 * Login screen with form validation and error states.
 * Task 1.2: Build login UI states (idle, loading, error).
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuthStore, selectIsLoading, selectError, selectPendingMfa } from '../store/authStore';
import {
  LoginFormValues,
  LoginFormErrors,
  AuthScreenState,
} from '../types/auth.types';
import { validateLoginForm, validateLoginField } from '../utils/validation';

export function LoginScreen() {
  const [formValues, setFormValues] = useState<LoginFormValues>({
    email: '',
    password: '',
    userType: 'candidate',
  });
  const [formErrors, setFormErrors] = useState<LoginFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const signIn = useAuthStore((state) => state.signIn);
  const clearError = useAuthStore((state) => state.clearError);
  const isLoading = useAuthStore(selectIsLoading);
  const error = useAuthStore(selectError);
  const pendingMfa = useAuthStore(selectPendingMfa);

  const screenState: AuthScreenState = isLoading
    ? 'loading'
    : error
    ? 'error'
    : 'idle';

  const handleChange = useCallback(
    (field: keyof LoginFormValues) => (value: string) => {
      setFormValues((prev) => ({ ...prev, [field]: value }));

      // Clear field error on change if touched
      if (touched[field]) {
        const fieldError = validateLoginField(field, value);
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
    (field: keyof LoginFormValues) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const fieldError = validateLoginField(field, formValues[field]);
      setFormErrors((prev) => ({ ...prev, [field]: fieldError }));
    },
    [formValues]
  );

  const handleSubmit = useCallback(async () => {
    if (isLoading) return; // Guard against concurrent submissions

    // Mark all fields as touched
    setTouched({ email: true, password: true, userType: true });

    // Validate form
    const errors = validateLoginForm(formValues);
    if (errors) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    await signIn(formValues);
  }, [formValues, signIn]);

  // If MFA is pending, navigate to MFA screen (handled by parent navigator)
  if (pendingMfa) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center px-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 text-center">
            Welcome Back
          </Text>
          <Text className="text-base text-gray-600 text-center mt-2">
            Sign in to continue your screening application
          </Text>
        </View>

        {/* Error Banner */}
        {error && (
          <View 
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
            accessibilityRole="alert"
          >
            <Text className="text-red-700 text-sm text-center">{error}</Text>
          </View>
        )}

        <View className="gap-y-4">
          {/* Email Field */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
            <TextInput
              className={`border rounded-lg px-4 py-3 text-base ${
                formErrors.email && touched.email
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 bg-white'
              }`}
              placeholder="you@example.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              value={formValues.email}
              onChangeText={handleChange('email')}
              onBlur={handleBlur('email')}
              editable={!isLoading}
              accessibilityLabel="Email address"
              accessibilityHint="Enter your email address"
            />
            {formErrors.email && touched.email && (
              <Text className="text-red-500 text-xs mt-1">{formErrors.email}</Text>
            )}
          </View>

          {/* Password Field */}
          <View className="mt-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
            <TextInput
              className={`border rounded-lg px-4 py-3 text-base ${
                formErrors.password && touched.password
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-300 bg-white'
              }`}
              placeholder="Enter your password"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
              value={formValues.password}
              onChangeText={handleChange('password')}
              onBlur={handleBlur('password')}
              editable={!isLoading}
              accessibilityLabel="Password"
              accessibilityHint="Enter your password"
            />
            {formErrors.password && touched.password && (
              <Text className="text-red-500 text-xs mt-1">{formErrors.password}</Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            className={`mt-6 py-4 rounded-lg ${
              isLoading ? 'bg-blue-400' : 'bg-blue-600'
            }`}
            onPress={handleSubmit}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
            accessibilityState={{ disabled: isLoading }}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Help Link */}
          <TouchableOpacity
            className="mt-4"
            onPress={() => Alert.alert(
              'Forgot Password',
              'Password reset is not yet available. Please contact support for assistance.',
              [{ text: 'OK' }]
            )}
            accessibilityRole="link"
            accessibilityLabel="Forgot your password"
          >
            <Text className="text-blue-600 text-center text-sm">
              Forgot your password?
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default LoginScreen;
