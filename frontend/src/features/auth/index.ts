/**
 * Auth Feature Module
 *
 * Encapsulates authentication pages, services, store, and components.
 */

// Pages
export { AuthLayout } from './pages/AuthLayout';
export { SignInView } from './pages/SignInView';
export { SignUpView } from './pages/SignUpView';
export { ForgotPasswordView } from './pages/ForgotPasswordView';
export { ResetPasswordView } from './pages/ResetPasswordView';
export { CandidateResetPasswordView } from './pages/CandidateResetPasswordView';
export { TotpVerifyView } from './pages/TotpVerifyView';
export { OAuthCallbackView } from './pages/OAuthCallbackView';

// Services
export { AuthService } from './services/AuthService';

// Store
export { useAuthStore } from './store/authStore';
