/**
 * Root layout for the Yezda candidate app.
 * Bootstraps auth session, provides auth guard, and wraps with providers.
 */

import '../global.css';

import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useAuthStore,
  selectIsAuthenticated,
  selectIsLoading,
  selectPendingMfa,
} from '@/store/authStore';

/**
 * Handles auth-based redirects using expo-router segments.
 */
function useAuthGuard() {
  const segments = useSegments();
  const router = useRouter();

  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isLoading = useAuthStore(selectIsLoading);
  const pendingMfa = useAuthStore(selectPendingMfa);

  useEffect(() => {
    if (isLoading) return;

    const currentRoute = segments[0] as string | undefined;
    const isOnAuthScreen =
      currentRoute === 'login' ||
      currentRoute === 'mfa' ||
      currentRoute === 'consent';

    if (pendingMfa && currentRoute !== 'mfa') {
      // MFA is required — redirect to MFA screen
      router.replace('/mfa');
    } else if (!isAuthenticated && !pendingMfa && !isOnAuthScreen) {
      // Not authenticated — redirect to login
      router.replace('/login');
    } else if (isAuthenticated && !pendingMfa && isOnAuthScreen) {
      // Already authenticated — redirect to tabs
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, pendingMfa, segments, router]);
}

/**
 * Splash/loading screen shown during auth bootstrap.
 */
function SplashScreen() {
  return (
    <View className="flex-1 bg-white items-center justify-center">
      <Text className="text-3xl font-bold text-blue-600 mb-4">Yezda</Text>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text className="text-gray-500 mt-4 text-sm">Loading...</Text>
    </View>
  );
}

export default function RootLayout() {
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const isLoading = useAuthStore(selectIsLoading);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  useAuthGuard();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="mfa" options={{ headerShown: false }} />
        <Stack.Screen
          name="consent"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
