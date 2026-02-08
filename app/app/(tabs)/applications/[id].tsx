/**
 * Application detail route — wraps ApplicationDetailScreen.
 * Reads the dynamic `id` param from the route and provides onBack callback.
 */

import React, { useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ApplicationDetailScreen } from '@/features/applications';

export default function ApplicationDetailRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  if (!id) {
    // Safety guard — should not happen with valid routing
    router.back();
    return null;
  }

  return <ApplicationDetailScreen applicationId={id} onBack={handleBack} />;
}
