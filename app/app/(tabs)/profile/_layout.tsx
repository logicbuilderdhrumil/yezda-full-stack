/**
 * Stack navigator layout for the profile tab.
 */

import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

function SettingsBackButton() {
  const router = useRouter();
  return (
    <TouchableOpacity
      onPress={() => router.navigate('/(tabs)/settings')}
      accessibilityRole="button"
      accessibilityLabel="Back to Settings"
      className="mr-2"
    >
      {/* @ts-expect-error Known React 18 type incompatibility with @expo/vector-icons */}
      <Ionicons name="chevron-back" size={24} color="#2563EB" />
    </TouchableOpacity>
  );
}

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#2563EB',
        headerTitleStyle: { fontWeight: '600', color: '#111827' },
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit"
        options={{
          title: 'Edit Profile',
          presentation: 'card',
        }}
      />
      <Stack.Screen
        name="password"
        options={{
          title: 'Change Password',
          presentation: 'card',
          headerLeft: () => <SettingsBackButton />,
        }}
      />
      <Stack.Screen
        name="consent"
        options={{
          title: 'Data Consents',
          presentation: 'card',
          headerLeft: () => <SettingsBackButton />,
        }}
      />
    </Stack>
  );
}
