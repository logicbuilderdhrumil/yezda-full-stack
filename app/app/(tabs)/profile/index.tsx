/**
 * Profile overview route — wraps ProfileOverviewScreen.
 * Provides navigation callbacks for edit and security actions.
 */

import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ProfileOverviewScreen } from '@/features/profile';

export default function ProfileOverviewRoute() {
  const router = useRouter();

  const handleEditPress = useCallback(() => {
    router.push('/(tabs)/profile/edit');
  }, [router]);

  const handleSecurityPress = useCallback(() => {
    router.push('/(tabs)/profile/password');
  }, [router]);

  return (
    <ProfileOverviewScreen
      onEditPress={handleEditPress}
      onSecurityPress={handleSecurityPress}
    />
  );
}
