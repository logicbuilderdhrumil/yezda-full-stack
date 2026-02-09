/**
 * Consent review route — wraps ConsentReviewScreen.
 * Accessible from the profile tab for reviewing consent history.
 */

import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ConsentReviewScreen } from '@/features/consent';

export default function ConsentReviewRoute() {
  const router = useRouter();

  const handleBack = useCallback(() => {
    router.navigate('/(tabs)/settings');
  }, [router]);

  return <ConsentReviewScreen onBack={handleBack} />;
}
