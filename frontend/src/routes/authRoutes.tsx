import { type RouteObject } from 'react-router-dom';
import {
  SignInView,
  SignUpView,
  ForgotPasswordView,
  ResetPasswordView,
  CandidateResetPasswordView,
  TotpVerifyView,
  OAuthCallbackView,
} from '@/views/auth';
import { PublicRoute } from '@/components/route';

/**
 * Auth routes configuration.
 * All routes are wrapped with PublicRoute to redirect authenticated users.
 */
export const authRoutes: RouteObject[] = [
  {
    path: '/sign-in',
    element: (
      <PublicRoute>
        <SignInView />
      </PublicRoute>
    ),
  },
  {
    path: '/sign-up',
    element: (
      <PublicRoute>
        <SignUpView />
      </PublicRoute>
    ),
  },
  {
    path: '/forgot-password',
    element: (
      <PublicRoute>
        <ForgotPasswordView />
      </PublicRoute>
    ),
  },
  {
    path: '/reset-password',
    element: (
      <PublicRoute>
        <ResetPasswordView />
      </PublicRoute>
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
  {
    path: '/oauth/callback',
    element: <OAuthCallbackView />,
  },
  {
    path: '/oauth/callback/:provider',
    element: <OAuthCallbackView />,
  },
];
