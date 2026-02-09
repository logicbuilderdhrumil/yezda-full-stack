/**
 * Application list route — wraps ApplicationListScreen.
 * Provides the onSelectApplication callback via expo-router navigation.
 */

import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ApplicationListScreen } from '@/features/applications';

export default function ApplicationListRoute() {
  const router = useRouter();

  const handleSelectApplication = useCallback(
    (applicationId: string) => {
      router.push(`/(tabs)/applications/${applicationId}`);
    },
    [router],
  );

  return <ApplicationListScreen onSelectApplication={handleSelectApplication} />;
}
