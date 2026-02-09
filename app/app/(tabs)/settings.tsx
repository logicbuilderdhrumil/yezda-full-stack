/**
 * Settings tab — links to profile, security, and consent management.
 */

import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/features/auth';

interface SettingsItemProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function SettingsItem({ icon, title, subtitle, onPress }: SettingsItemProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center py-4 border-b border-gray-100"
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
    >
      <View className="w-10 h-10 bg-blue-50 rounded-lg items-center justify-center mr-4">
        {/* @ts-expect-error Known React 18 type incompatibility with @expo/vector-icons */}
        <Ionicons name={icon} size={20} color="#2563EB" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-medium text-gray-900">{title}</Text>
        <Text className="text-sm text-gray-500 mt-0.5">{subtitle}</Text>
      </View>
      {/* @ts-expect-error Known React 18 type incompatibility with @expo/vector-icons */}
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );
}

export default function SettingsRoute() {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);

  const doSignOut = useCallback(async () => {
    await signOut();
    router.replace('/login');
  }, [signOut, router]);

  const handleSignOut = useCallback(() => {
    if (Platform.OS === 'web') {
      // Alert.alert doesn't show confirmation dialogs on web; use window.confirm
      if (typeof window !== 'undefined' && window.confirm('Are you sure you want to sign out?')) {
        doSignOut();
      }
      return;
    }
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: doSignOut,
        },
      ],
    );
  }, [doSignOut]);

  return (
    <ScrollView className="flex-1 bg-gray-50" contentContainerClassName="pb-8">
      {/* Header */}
      <View className="bg-white px-6 py-6 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Settings</Text>
      </View>

      {/* Account Section */}
      <View className="bg-white mt-4 px-6">
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-2">
          Account
        </Text>
        <SettingsItem
          icon="person-outline"
          title="Profile"
          subtitle="View and edit your profile"
          onPress={() => router.push('/(tabs)/profile')}
        />
        <SettingsItem
          icon="lock-closed-outline"
          title="Security"
          subtitle="Password and authentication"
          onPress={() => router.push('/(tabs)/profile/password')}
        />
        <SettingsItem
          icon="shield-checkmark-outline"
          title="Data Consents"
          subtitle="Manage your consent decisions"
          onPress={() => router.push('/(tabs)/profile/consent')}
        />
      </View>

      {/* About Section */}
      <View className="bg-white mt-4 px-6">
        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-4 pb-2">
          About
        </Text>
        <View className="py-4 border-b border-gray-100">
          <Text className="text-base font-medium text-gray-900">Version</Text>
          <Text className="text-sm text-gray-500 mt-0.5">1.0.0</Text>
        </View>
      </View>

      {/* Sign Out */}
      <View className="px-6 mt-8">
        <TouchableOpacity
          className="py-4 rounded-lg border border-red-300 bg-red-50"
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <Text className="text-red-600 text-center font-semibold text-base">
            Sign Out
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
