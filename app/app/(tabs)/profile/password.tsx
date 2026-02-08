/**
 * Password change route — wraps PasswordChangeScreen.
 * Provides back and continue callbacks.
 */

import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { PasswordChangeScreen } from '@/screens/PasswordChangeScreen';

export default function PasswordChangeRoute() {
  const router = useRouter();

  const handleBackPress = useCallback(() => {
    router.navigate('/(tabs)/settings');
  }, [router]);

  const handleContinue = useCallback(() => {
    // Password change flow is not yet implemented on the backend.
    // Show informational alert for now.
    Alert.alert(
      'Coming Soon',
      'The password change flow will redirect to a secure portal. This feature is not yet available.',
      [{ text: 'OK' }],
    );
  }, []);

  return (
    <PasswordChangeScreen
      onBackPress={handleBackPress}
      onContinue={handleContinue}
    />
  );
}
