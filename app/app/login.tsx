/**
 * Login route — wraps the LoginScreen component.
 * LoginScreen is self-contained: it reads/writes auth state internally.
 * Auth state changes (isAuthenticated, pendingMfa) are detected by the
 * root layout auth guard which handles redirection.
 */

import React from 'react';
import { LoginScreen } from '@/screens/LoginScreen';

export default function LoginRoute() {
  return <LoginScreen />;
}
