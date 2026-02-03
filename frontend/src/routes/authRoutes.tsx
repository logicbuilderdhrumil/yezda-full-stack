import { type RouteObject } from 'react-router-dom';
import {
  SignInView,
  SignUpView,
  ForgotPasswordView,
  ResetPasswordView,
  CandidateResetPasswordView,
  TotpVerifyView,
} from '@/views/auth';
import { RequireGuest } from '@/components/auth';

/**
 * Auth routes configuration.
 * All routes are wrapped with RequireGuest to redirect authenticated users.
 */
export const authRoutes: RouteObject[] = [
  {
    path: '/sign-in',
    element: (
      <RequireGuest>
        <SignInView />
      </RequireGuest>
    ),
  },
  {
    path: '/sign-up',
    element: (
      <RequireGuest>
        <SignUpView />
      </RequireGuest>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <RequireGuest>
        <ForgotPasswordView />
      </RequireGuest>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <RequireGuest>
        <ResetPasswordView />
      </RequireGuest>
    ),
  },
  {
    path: '/candidate-reset-password',
    element: <CandidateResetPasswordView />,
  },
  {
    path: '/totp-verify',
    element: <TotpVerifyView />,
  },
];
