/**
 * Profile edit route — wraps ProfileEditScreen.
 * Provides save/cancel callbacks that navigate back to profile overview.
 */

import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ProfileEditScreen } from '@/screens/ProfileEditScreen';

export default function ProfileEditRoute() {
  const router = useRouter();

  const handleSaveSuccess = useCallback(() => {
    router.back();
  }, [router]);

  const handleCancel = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <ProfileEditScreen
      onSaveSuccess={handleSaveSuccess}
      onCancel={handleCancel}
    />
  );
}
