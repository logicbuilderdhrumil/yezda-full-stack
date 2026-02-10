/**
 * Consent prompt route — wraps the ConsentPromptScreen component.
 * Used during the auth flow when consent is pending before entering the app.
 * Expects `applicationId` as a search param (e.g., /consent?applicationId=abc).
 */

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ConsentPromptScreen } from '@/features/consent';

export default function ConsentRoute() {
  const router = useRouter();
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();

  const handleComplete = useCallback(
    (_accepted: boolean) => {
      router.replace('/(tabs)');
    },
    [router],
  );

  const handleSkip = useCallback(() => {
    router.replace('/(tabs)');
  }, [router]);

  // If no applicationId was provided, show fallback and redirect
  if (!applicationId) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-lg font-semibold text-slate-900 mb-2">
          No Consent Required
        </Text>
        <Text className="text-slate-600 text-center mb-6">
          There are no pending consent prompts at this time.
        </Text>
        <TouchableOpacity
          className="bg-navy-600 px-6 py-3 rounded-lg"
          onPress={() => router.replace('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="Continue to app"
        >
          <Text className="text-white font-semibold">Continue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ConsentPromptScreen
      applicationId={applicationId}
      onComplete={handleComplete}
      onSkip={handleSkip}
    />
  );
}
