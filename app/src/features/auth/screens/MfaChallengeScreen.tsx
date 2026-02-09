/**
 * MFA challenge screen for multi-factor authentication.
 * Task 1.6: Add MFA challenge screen and fallback guidance.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  useAuthStore,
  selectIsLoading,
  selectError,
  selectPendingMfa,
} from '../store/authStore';
import { authErrorMessages, MfaChallengeType } from '../types/auth.types';

const CODE_LENGTH = 6;

function getMfaTitle(type: MfaChallengeType): string {
  switch (type) {
    case 'totp':
      return 'Enter Authenticator Code';
    case 'sms':
      return 'Enter SMS Code';
    case 'email':
      return 'Enter Email Code';
    default:
      return 'Enter Verification Code';
  }
}

function getMfaDescription(type: MfaChallengeType, hint?: string): string {
  switch (type) {
    case 'totp':
      return 'Enter the 6-digit code from your authenticator app.';
    case 'sms':
      return hint
        ? `We sent a code to the phone ending in ${hint}.`
        : 'We sent a verification code to your phone.';
    case 'email':
      return hint
        ? `We sent a code to ${hint}.`
        : 'We sent a verification code to your email.';
    default:
      return 'Enter the verification code you received.';
  }
}

export function MfaChallengeScreen() {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const cooldownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const verifyMfa = useAuthStore((state) => state.verifyMfa);
  const signOut = useAuthStore((state) => state.signOut);
  const clearError = useAuthStore((state) => state.clearError);
  const isLoading = useAuthStore(selectIsLoading);
  const error = useAuthStore(selectError);
  const pendingMfa = useAuthStore(selectPendingMfa);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      if (cooldownIntervalRef.current) {
        clearInterval(cooldownIntervalRef.current);
      }
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (code.length !== CODE_LENGTH || !pendingMfa || isLoading || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyMfa({
        challengeId: pendingMfa.challengeId,
        code,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [code, pendingMfa, verifyMfa, isLoading, isSubmitting]);

  const handleCodeChange = useCallback(
    (value: string) => {
      // Only allow digits
      const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH);
      setCode(digits);

      // Clear error when user types
      if (error) {
        clearError();
      }
    },
    [error, clearError]
  );

  // Auto-submit when all 6 digits are entered (guarded by no prior error)
  useEffect(() => {
    if (code.length === CODE_LENGTH && pendingMfa && !isLoading && !isSubmitting && !error) {
      handleSubmit();
    }
  }, [code, pendingMfa, isLoading, isSubmitting, error, handleSubmit]);

  const handleResendCode = useCallback(async () => {
    if (resendCooldown > 0 || !pendingMfa) return;

    // Resend API not yet available - inform user and start cooldown
    Alert.alert(
      'Code Requested',
      'Resend functionality is not yet available. Please wait a moment for your original code to arrive, or contact support if you continue to have issues.',
      [{ text: 'OK' }]
    );

    // Start cooldown timer (60 seconds) to prevent spamming
    setResendCooldown(60);
    cooldownIntervalRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownIntervalRef.current) {
            clearInterval(cooldownIntervalRef.current);
            cooldownIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [resendCooldown, pendingMfa]);

  const handleCancel = useCallback(async () => {
    await signOut();
  }, [signOut]);

  if (!pendingMfa) {
    return null;
  }

  const isCodeComplete = code.length === CODE_LENGTH;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-gray-900 text-center">
            {getMfaTitle(pendingMfa.type)}
          </Text>
          <Text className="text-base text-gray-600 text-center mt-2">
            {getMfaDescription(pendingMfa.type, pendingMfa.hint)}
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

        {/* Code Input */}
        <View className="mb-6">
          <TextInput
            ref={inputRef}
            className="border border-gray-300 rounded-lg px-4 py-4 text-2xl text-center tracking-widest font-mono"
            value={code}
            onChangeText={handleCodeChange}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            autoComplete="one-time-code"
            editable={!isLoading}
            accessibilityLabel="Verification code"
            accessibilityHint={`Enter the ${CODE_LENGTH}-digit verification code`}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className={`py-4 rounded-lg ${
            isLoading || !isCodeComplete ? 'bg-blue-400' : 'bg-blue-600'
          }`}
          onPress={handleSubmit}
          disabled={isLoading || !isCodeComplete}
          accessibilityRole="button"
          accessibilityLabel="Verify code"
          accessibilityState={{ disabled: isLoading || !isCodeComplete }}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-semibold text-base">
              Verify
            </Text>
          )}
        </TouchableOpacity>

        {/* Fallback Guidance */}
        <View className="mt-8 p-4 bg-gray-50 rounded-lg">
          <Text className="text-sm text-gray-700 font-medium mb-2">
            Having trouble?
          </Text>
          <Text className="text-sm text-gray-600">
            {pendingMfa.type === 'totp'
              ? "Make sure your authenticator app is synced and try again. If you've lost access to your device, contact support."
              : "Didn't receive a code? Wait a few moments and check your spam folder. If you still don't see it, contact support."}
          </Text>
        </View>

        {/* Resend Code Button (SMS/Email only) */}
        {(pendingMfa.type === 'sms' || pendingMfa.type === 'email') && (
          <TouchableOpacity
            className="mt-4"
            onPress={handleResendCode}
            disabled={resendCooldown > 0 || isLoading}
            accessibilityRole="button"
            accessibilityLabel={resendCooldown > 0 ? `Resend code available in ${resendCooldown} seconds` : 'Resend code'}
          >
            <Text className={`text-center text-sm ${resendCooldown > 0 ? 'text-gray-400' : 'text-blue-600'}`}>
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Cancel Link */}
        <TouchableOpacity
          className="mt-6"
          onPress={handleCancel}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Cancel and sign out"
        >
          <Text className="text-gray-600 text-center text-sm">
            Cancel and return to sign in
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

export default MfaChallengeScreen;
