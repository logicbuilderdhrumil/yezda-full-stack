/**
 * Stack navigator layout for the profile tab.
 */

import React from 'react';
import { Stack } from 'expo-router';

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
        }}
      />
      <Stack.Screen
        name="consent"
        options={{
          title: 'Data Consents',
          presentation: 'card',
        }}
      />
    </Stack>
  );
}
