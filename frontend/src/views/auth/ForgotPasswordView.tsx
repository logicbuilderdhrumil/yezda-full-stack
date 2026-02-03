import { useState, type ReactNode, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthLayout } from './AuthLayout';
import { ErrorMessage, LoadingOverlay } from '@/components/ui';

interface FormData {
  email: string;
}

interface FormErrors {
  email?: string;
}

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  return errors;
}

/**
 * Forgot password page with email form and success confirmation.
 */
export function ForgotPasswordView(): ReactNode {
  const { requestPasswordReset, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState<FormData>({ email: '' });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ email: e.target.value });
    if (error) clearError();
    if (formErrors.email) {
      setFormErrors({});
    }
    setSuccess(false);
  };

  const handleBlur = () => {
    setTouched({ email: true });
    const errors = validateForm(formData);
    if (errors.email) {
      setFormErrors(errors);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors = validateForm(formData);
    setFormErrors(errors);
    setTouched({ email: true });

    if (Object.keys(errors).length > 0) return;

    const sent = await requestPasswordReset({ email: formData.email });
    if (sent) {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent a password reset link to your email address."
      >
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <p className="mb-6 text-sm text-gray-600">
            If an account with <span className="font-medium">{formData.email}</span> exists, you
            will receive a password reset link shortly.
          </p>
          <Link
            to="/sign-in"
            className="inline-flex justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90"
          >
            Return to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <LoadingOverlay isLoading={isLoading} message="Sending reset link...">
        <form onSubmit={handleSubmit} className="space-y-5">
          <ErrorMessage error={error} onDismiss={clearError} className="mb-4" />

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
                touched.email && formErrors.email
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-primary focus:ring-primary/20'
              }`}
              placeholder="you@example.com"
            />
            {touched.email && formErrors.email && (
              <p className="mt-1.5 text-xs text-red-600">{formErrors.email}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send reset link
          </button>

          <p className="text-center text-sm text-gray-600">
            Remember your password?{' '}
            <Link to="/sign-in" className="font-medium text-primary hover:text-primary/80">
              Sign in
            </Link>
          </p>
        </form>
      </LoadingOverlay>
    </AuthLayout>
  );
}
