/**
 * Hook for sign-out handling.
 * Task 1.7: Add sign-out handling and token clearing.
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuthStore, selectIsLoading } from '../store/authStore';

interface UseSignOutOptions {
  showConfirmation?: boolean;
}

/**
 * Hook for handling user sign-out with optional confirmation.
 */
export function useSignOut(options: UseSignOutOptions = {}) {
  const { showConfirmation = true } = options;

  const signOutAction = useAuthStore((state) => state.signOut);
  const isLoading = useAuthStore(selectIsLoading);

  const signOut = useCallback(() => {
    if (showConfirmation) {
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: () => signOutAction(),
          },
        ],
        { cancelable: true }
      );
    } else {
      signOutAction();
    }
  }, [showConfirmation, signOutAction]);

  return {
    signOut,
    isLoading,
  };
}

export default useSignOut;
