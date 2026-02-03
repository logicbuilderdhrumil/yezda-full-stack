/**
 * Profile overview screen with read-only details.
 * Task 1.2: Build profile overview screen with read-only details.
 * Task 1.4: Integrate profile read API call and loading states.
 * Task 1.6: Add password change entry point and guidance.
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  useProfileStore,
  selectProfile,
  selectProfileScreenState,
  selectProfileError,
} from '../store/profileStore';

interface ProfileOverviewScreenProps {
  onEditPress?: () => void;
  onSecurityPress?: () => void;
}

export function ProfileOverviewScreen({
  onEditPress,
  onSecurityPress,
}: ProfileOverviewScreenProps) {
  const profile = useProfileStore(selectProfile);
  const screenState = useProfileStore(selectProfileScreenState);
  const error = useProfileStore(selectProfileError);
  const loadProfile = useProfileStore((state) => state.loadProfile);
  const clearError = useProfileStore((state) => state.clearError);

  const isLoading = screenState === 'loading';
  const isRefreshing = isLoading && profile !== null;

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleRefresh = useCallback(() => {
    clearError();
    loadProfile();
  }, [loadProfile, clearError]);

  // Initial loading state
  if (isLoading && !profile) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-gray-600 mt-4">Loading profile...</Text>
      </View>
    );
  }

  // Error state with retry
  if (error && !profile) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-6">
        <Text className="text-red-600 text-center mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-blue-600 px-6 py-3 rounded-lg"
          onPress={handleRefresh}
          accessibilityRole="button"
          accessibilityLabel="Retry loading profile"
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fullName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : '';

  const formattedAddress = profile?.address
    ? [
        profile.address.street,
        profile.address.city,
        profile.address.state,
        profile.address.zipCode,
        profile.address.country,
      ]
        .filter(Boolean)
        .join(', ')
    : null;

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerClassName="pb-8"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Error Banner */}
      {error && (
        <View
          className="bg-red-50 border-b border-red-200 p-4"
          accessibilityRole="alert"
        >
          <Text className="text-red-700 text-sm text-center">{error}</Text>
        </View>
      )}

      {/* Profile Header */}
      <View className="bg-white px-6 py-6 border-b border-gray-200">
        <View className="items-center">
          <View className="w-20 h-20 bg-blue-100 rounded-full justify-center items-center mb-4">
            <Text className="text-blue-600 text-2xl font-bold">
              {profile?.firstName?.charAt(0) ?? ''}
              {profile?.lastName?.charAt(0) ?? ''}
            </Text>
          </View>
          <Text className="text-xl font-semibold text-gray-900">{fullName}</Text>
          <Text className="text-gray-600 mt-1">{profile?.email}</Text>
        </View>
      </View>

      {/* Profile Details */}
      <View className="bg-white mt-4 px-6 py-4">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Personal Information
        </Text>

        <ProfileField label="First Name" value={profile?.firstName} />
        <ProfileField label="Last Name" value={profile?.lastName} />
        <ProfileField label="Email" value={profile?.email} />
        <ProfileField
          label="Phone"
          value={profile?.phone}
          placeholder="Not provided"
        />
        <ProfileField
          label="Address"
          value={formattedAddress}
          placeholder="Not provided"
          isLast
        />
      </View>

      {/* Edit Profile Button */}
      <View className="px-6 mt-6">
        <TouchableOpacity
          testID="edit-profile-button"
          className="bg-blue-600 py-4 rounded-lg"
          onPress={onEditPress}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
        >
          <Text className="text-white text-center font-semibold text-base">
            Edit Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Security Section */}
      <View className="bg-white mt-6 px-6 py-4">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Account Security
        </Text>

        <TouchableOpacity
          testID="change-password-button"
          className="flex-row justify-between items-center py-4 border-b border-gray-100"
          onPress={onSecurityPress}
          accessibilityRole="button"
          accessibilityLabel="Change password"
          accessibilityHint="Navigate to password change screen"
        >
          <View>
            <Text className="text-gray-900 font-medium">Password</Text>
            <Text className="text-gray-500 text-sm mt-1">
              Update your account password
            </Text>
          </View>
          <Text className="text-blue-600 text-2xl">›</Text>
        </TouchableOpacity>

        <View className="py-4">
          <Text className="text-gray-500 text-sm">
            Keep your account secure by using a strong password and enabling
            two-factor authentication when available.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

interface ProfileFieldProps {
  label: string;
  value?: string | null;
  placeholder?: string;
  isLast?: boolean;
}

function ProfileField({
  label,
  value,
  placeholder = '—',
  isLast = false,
}: ProfileFieldProps) {
  return (
    <View
      className={`py-3 ${isLast ? '' : 'border-b border-gray-100'}`}
      accessibilityLabel={`${label}: ${value ?? placeholder}`}
    >
      <Text className="text-gray-500 text-sm">{label}</Text>
      <Text
        className={`text-base mt-1 ${value ? 'text-gray-900' : 'text-gray-400'}`}
      >
        {value ?? placeholder}
      </Text>
    </View>
  );
}

export default ProfileOverviewScreen;
