import { useState, type ReactNode, type FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { validatePassword } from '@/utils/validation';
import { AuthLayout } from './AuthLayout';
import { ErrorMessage, LoadingOverlay } from '@/components/ui';

interface FormData {
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  const passwordError = validatePassword(data.password);
  if (passwordError) {
    errors.password = passwordError;
  }

  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password';
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return errors;
}

/**
 * Password reset page with token from URL and new password form.
 */
export function ResetPasswordView(): ReactNode {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const { resetPassword, isLoading, error, clearError } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    password: '',
    confirmPassword: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [success, setSuccess] = useState(false);

  const handleChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (error) clearError();
      if (formErrors[field]) {
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };

  const handleBlur = (field: keyof FormData) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errors = validateForm(formData);
    if (errors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: errors[field] }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors = validateForm(formData);
    setFormErrors(errors);
    setTouched({ password: true, confirmPassword: true });

    if (Object.keys(errors).length > 0) return;

    if (!token) {
      return;
    }

    const reset = await resetPassword({ token, password: formData.password });
    if (reset) {
      setSuccess(true);
    }
  };

  // No token provided
  if (!token) {
    return (
      <AuthLayout title="Invalid link" subtitle="This password reset link is invalid or expired.">
        <div className="text-center">
          <Link
            to="/forgot-password"
            className="inline-flex justify-center rounded-lg bg-[var(--color-cta)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-cta-hover)]"
          >
            Request new reset link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout
        title="Password reset successful"
        subtitle="Your password has been changed successfully."
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
          <p className="mb-6 text-sm text-[var(--color-muted-foreground)]">
            You can now sign in with your new password.
          </p>
          <button
            onClick={() => navigate('/sign-in')}
            className="inline-flex justify-center rounded-lg bg-[var(--color-cta)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-cta-hover)]"
          >
            Sign in
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your new password below."
    >
      <LoadingOverlay isLoading={isLoading} message="Resetting password...">
        <form onSubmit={handleSubmit} className="space-y-5">
          <ErrorMessage error={error} onDismiss={clearError} className="mb-4" />

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-foreground)]">
              New password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange('password')}
              onBlur={handleBlur('password')}
              className={`mt-1 block w-full rounded-lg border bg-white dark:bg-slate-700 text-[var(--color-foreground)] px-4 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
                touched.password && formErrors.password
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-[var(--color-border)] focus:border-[var(--color-cta)] focus:ring-[var(--color-cta)]/20'
              }`}
              placeholder="••••••••"
            />
            {touched.password && formErrors.password && (
              <p className="mt-1.5 text-xs text-red-600">{formErrors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--color-foreground)]">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              className={`mt-1 block w-full rounded-lg border bg-white dark:bg-slate-700 text-[var(--color-foreground)] px-4 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
                touched.confirmPassword && formErrors.confirmPassword
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-[var(--color-border)] focus:border-[var(--color-cta)] focus:ring-[var(--color-cta)]/20'
              }`}
              placeholder="••••••••"
            />
            {touched.confirmPassword && formErrors.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-600">{formErrors.confirmPassword}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-lg bg-[var(--color-cta)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-cta-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--color-cta)] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Reset password
          </button>
        </form>
      </LoadingOverlay>
    </AuthLayout>
  );
}
