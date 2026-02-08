/**
 * Consent review route — wraps ConsentReviewScreen.
 * Accessible from the profile tab for reviewing consent history.
 */

import React, { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { ConsentReviewScreen } from '@/screens/ConsentReviewScreen';

export default function ConsentReviewRoute() {
  const router = useRouter();

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  return <ConsentReviewScreen onBack={handleBack} />;
}
