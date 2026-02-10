/**
 * Application detail screen with form rendering, validation, draft save, and submission.
 * Task 1.2: Build application detail entry and metadata display.
 * Task 1.3: Implement dynamic form renderer for supported field types.
 * Task 1.4: Implement field-level validation and error summaries.
 * Task 1.5: Implement draft save and resume behavior.
 * Task 1.6: Implement final submission and confirmation states.
 */

import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  useApplicationStore,
  selectCurrentApplication,
  selectDetailScreenState,
  selectDetailError,
  selectFormValues,
  selectFormErrors,
  selectIsDirty,
  selectLastSavedAt,
  selectSuccessMessage,
  selectSubmittedAt,
} from '../store/applicationStore';
import { FormSection, FormField, FormErrors } from '../types/application.types';
import { FormFieldRenderer } from './components/FormFieldRenderer';
import {
  validateField,
  validateForm,
  hasErrors,
  getErrorSummary,
} from '../utils/applicationValidation';

interface ApplicationDetailScreenProps {
  applicationId: string;
  onBack: () => void;
}

/**
 * Format timestamp for display.
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Section header component.
 */
function SectionHeader({ section }: { section: FormSection }) {
  return (
    <View className="mb-4 pt-4">
      <Text className="text-xl font-bold text-slate-900">{section.title}</Text>
      {section.description && (
        <Text className="text-sm text-slate-600 mt-1">{section.description}</Text>
      )}
    </View>
  );
}

/**
 * Error summary banner.
 */
function ErrorSummary({ errors }: { errors: FormErrors }) {
  const summary = getErrorSummary(errors);

  if (!summary) return null;

  return (
    <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4" accessibilityRole="alert">
      <Text className="text-red-700 font-medium">{summary}</Text>
      <Text className="text-red-600 text-sm mt-1">
        Please correct the highlighted fields before submitting.
      </Text>
    </View>
  );
}

/**
 * Submission confirmation view.
 */
function SubmissionConfirmation({
  message,
  submittedAt,
  onBack,
}: {
  message: string;
  submittedAt: string;
  onBack: () => void;
}) {
  return (
    <View className="flex-1 justify-center items-center px-6 bg-white">
      <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-6">
        <Text className="text-4xl">✓</Text>
      </View>
      <Text className="text-2xl font-bold text-slate-900 text-center mb-2">
        Application Submitted!
      </Text>
      <Text className="text-base text-slate-600 text-center mb-4">{message}</Text>
      <Text className="text-sm text-slate-500 mb-8">
        Submitted on {new Date(submittedAt).toLocaleString()}
      </Text>
      <TouchableOpacity
        className="bg-navy-600 px-8 py-4 rounded-lg"
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back to applications"
      >
        <Text className="text-white font-semibold text-base">Back to Applications</Text>
      </TouchableOpacity>
      <View className="mt-8 px-4">
        <Text className="text-sm text-slate-600 text-center">
          <Text className="font-medium">What's next?</Text> We'll review your application
          and notify you of any updates. You can check the status in your applications list.
        </Text>
      </View>
    </View>
  );
}

/**
 * Application detail screen.
 */
export function ApplicationDetailScreen({
  applicationId,
  onBack,
}: ApplicationDetailScreenProps) {
  const application = useApplicationStore(selectCurrentApplication);
  const screenState = useApplicationStore(selectDetailScreenState);
  const detailError = useApplicationStore(selectDetailError);
  const formValues = useApplicationStore(selectFormValues);
  const formErrors = useApplicationStore(selectFormErrors);
  const isDirty = useApplicationStore(selectIsDirty);
  const lastSavedAt = useApplicationStore(selectLastSavedAt);
  const successMessage = useApplicationStore(selectSuccessMessage);
  const submittedAt = useApplicationStore(selectSubmittedAt);

  const loadApplication = useApplicationStore((state) => state.loadApplication);
  const setFieldValue = useApplicationStore((state) => state.setFieldValue);
  const setFieldErrors = useApplicationStore((state) => state.setFieldErrors);
  const clearFieldError = useApplicationStore((state) => state.clearFieldError);
  const saveDraft = useApplicationStore((state) => state.saveDraft);
  const submitApplication = useApplicationStore((state) => state.submitApplication);
  const clearError = useApplicationStore((state) => state.clearError);

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Load application on mount
  useEffect(() => {
    loadApplication(applicationId);
  }, [applicationId, loadApplication]);

  // Handle field change
  const handleFieldChange = useCallback(
    (fieldId: string, value: string | string[] | boolean) => {
      setFieldValue(fieldId, value);

      // Clear error when user modifies field
      if (touched[fieldId] && formErrors[fieldId]) {
        clearFieldError(fieldId);
      }
    },
    [setFieldValue, touched, formErrors, clearFieldError]
  );

  // Handle field blur - validate on blur
  const handleFieldBlur = useCallback(
    (field: FormField) => {
      setTouched((prev) => ({ ...prev, [field.id]: true }));

      const value = formValues[field.id];
      const error = validateField(field, value);

      if (error) {
        setFieldErrors({ ...formErrors, [field.id]: error });
      } else {
        clearFieldError(field.id);
      }
    },
    [formValues, formErrors, setFieldErrors, clearFieldError]
  );

  // Handle save draft
  const handleSaveDraft = useCallback(async () => {
    await saveDraft();
  }, [saveDraft]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    if (!application) return;

    // Validate all fields
    const errors = validateForm(application.sections, formValues);

    if (hasErrors(errors)) {
      setFieldErrors(errors);
      // Mark all fields as touched
      const allTouched: Record<string, boolean> = {};
      for (const section of application.sections) {
        for (const field of section.fields) {
          allTouched[field.id] = true;
        }
      }
      setTouched(allTouched);
      return;
    }

    // Confirm submission
    Alert.alert(
      'Submit Application',
      'Are you sure you want to submit this application? You will not be able to make changes after submission.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit',
          style: 'default',
          onPress: async () => {
            await submitApplication();
          },
        },
      ]
    );
  }, [application, formValues, setFieldErrors, submitApplication]);

  // Handle back with unsaved changes warning
  const handleBack = useCallback(() => {
    if (isDirty) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Do you want to save before leaving?',
        [
          { text: 'Discard', style: 'destructive', onPress: onBack },
          {
            text: 'Save & Exit',
            onPress: async () => {
              await saveDraft();
              onBack();
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    } else {
      onBack();
    }
  }, [isDirty, onBack, saveDraft]);

  // Sorted sections
  const sortedSections = useMemo(() => {
    if (!application) return [];
    return [...application.sections].sort((a, b) => a.order - b.order);
  }, [application]);

  // Loading state
  if (screenState === 'loading') {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0369A1" />
        <Text className="text-slate-600 mt-4">Loading application...</Text>
      </View>
    );
  }

  // Error state
  if (screenState === 'error' && !application) {
    return (
      <View className="flex-1 justify-center items-center px-6 bg-white">
        <Text className="text-xl font-semibold text-slate-900 mb-2">
          Something went wrong
        </Text>
        <Text className="text-base text-slate-600 text-center mb-4">
          {detailError || 'Unable to load application'}
        </Text>
        <TouchableOpacity
          className="bg-navy-600 px-6 py-3 rounded-lg"
          onPress={() => loadApplication(applicationId)}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="mt-4"
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text className="text-navy-600">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Submission confirmation
  if (screenState === 'submitted' && submittedAt) {
    return (
      <SubmissionConfirmation
        message={successMessage || 'Your application has been received.'}
        submittedAt={submittedAt}
        onBack={onBack}
      />
    );
  }

  if (!application) return null;

  const isSubmitting = screenState === 'submitting';
  const isSaving = screenState === 'saving';
  const isDisabled = isSubmitting || application.status === 'submitted';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1">
        {/* Header */}
        <View className="border-b border-slate-200 px-4 py-3 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={handleBack}
            className="py-2 pr-4"
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text className="text-navy-600 text-base">← Back</Text>
          </TouchableOpacity>
          <View className="flex-row items-center">
            {lastSavedAt && (
              <Text className="text-xs text-slate-500 mr-3">
                Saved {formatTimestamp(lastSavedAt)}
              </Text>
            )}
            {!isDisabled && (
              <TouchableOpacity
                onPress={handleSaveDraft}
                disabled={isSaving || !isDirty}
                className={`bg-slate-100 px-4 py-2 rounded-lg ${
                  isSaving || !isDirty ? 'opacity-50' : ''
                }`}
                accessibilityRole="button"
                accessibilityLabel="Save draft"
                accessibilityState={{ disabled: isSaving || !isDirty }}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#64748B" />
                ) : (
                  <Text className="text-slate-700 font-medium">Save Draft</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Form content */}
        <ScrollView
          className="flex-1 px-4"
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Application title */}
          <View className="py-4">
            <Text className="text-2xl font-bold text-slate-900">{application.title}</Text>
            {application.description && (
              <Text className="text-base text-slate-600 mt-2">{application.description}</Text>
            )}
            {application.dueDate && application.status !== 'submitted' && (
              <Text className="text-sm text-slate-500 mt-2">
                Due: {new Date(application.dueDate).toLocaleDateString()}
              </Text>
            )}
          </View>

          {/* Error banner */}
          {detailError && (
            <View
              className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4"
              accessibilityRole="alert"
            >
              <Text className="text-red-700">{detailError}</Text>
              <TouchableOpacity onPress={clearError} className="mt-2">
                <Text className="text-red-600 text-sm underline">Dismiss</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Success toast */}
          {successMessage && screenState !== 'submitted' && (
            <View className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <Text className="text-green-700">{successMessage}</Text>
            </View>
          )}

          {/* Validation error summary */}
          {hasErrors(formErrors) && <ErrorSummary errors={formErrors} />}

          {/* Form sections */}
          {sortedSections.map((section) => (
            <View key={section.id}>
              <SectionHeader section={section} />
              {[...section.fields]
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <FormFieldRenderer
                    key={field.id}
                    field={field}
                    value={formValues[field.id]}
                    error={touched[field.id] ? formErrors[field.id] : undefined}
                    onChange={(value) => handleFieldChange(field.id, value)}
                    onBlur={() => handleFieldBlur(field)}
                    disabled={isDisabled}
                  />
                ))}
            </View>
          ))}
        </ScrollView>

        {/* Submit button */}
        {!isDisabled && (
          <View className="border-t border-slate-200 px-4 py-4 bg-white">
            <TouchableOpacity
              className={`py-4 rounded-lg ${
                isSubmitting ? 'bg-navy-400' : 'bg-navy-600'
              }`}
              onPress={handleSubmit}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Submit application"
              accessibilityState={{ disabled: isSubmitting }}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white text-center font-semibold text-base">
                  Submit Application
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

export default ApplicationDetailScreen;
