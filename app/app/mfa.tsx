/**
 * MFA route — wraps the MfaChallengeScreen component.
 * MfaChallengeScreen is self-contained: it verifies MFA via the auth store.
 * On successful verification, isAuthenticated becomes true and the root
 * layout auth guard redirects to /(tabs). If cancelled, signOut clears
 * auth state and the guard redirects to /login.
 */

import React from 'react';
import { MfaChallengeScreen } from '@/features/auth';

export default function MfaRoute() {
  return <MfaChallengeScreen />;
}
