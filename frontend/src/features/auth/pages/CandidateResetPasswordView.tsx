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
 * Candidate password reset page with token and candidateId from URL.
 */
export function CandidateResetPasswordView(): ReactNode {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const candidateId = searchParams.get('candidateId');

  const { resetCandidatePassword, isLoading, error, clearError } = useAuth();

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

    if (!token || !candidateId) {
      return;
    }

    const reset = await resetCandidatePassword({
      token,
      candidateId,
      password: formData.password,
    });
    if (reset) {
      setSuccess(true);
    }
  };

  // Missing required params
  if (!token || !candidateId) {
    return (
      <AuthLayout
        title="Invalid link"
        subtitle="This password reset link is invalid or expired."
      >
        <div className="text-center">
          <p className="mb-6 text-sm text-[var(--color-muted-foreground)]">
            Please contact your employer to request a new password reset link.
          </p>
          <Link
            to="/sign-in"
            className="inline-flex justify-center rounded-lg bg-[var(--color-cta)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-cta-hover)]"
          >
            Go to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout
        title="Password set successfully"
        subtitle="Your password has been set. You can now access your screening portal."
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
          <button
            onClick={() => navigate('/sign-in')}
            className="inline-flex justify-center rounded-lg bg-[var(--color-cta)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--color-cta-hover)]"
          >
            Sign in to continue
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your password"
      subtitle="Set a password to access your screening portal."
    >
      <LoadingOverlay isLoading={isLoading} message="Setting password...">
        <form onSubmit={handleSubmit} className="space-y-5">
          <ErrorMessage error={error} onDismiss={clearError} className="mb-4" />

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[var(--color-foreground)]">
              Password
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
            <p className="mt-1.5 text-xs text-[var(--color-muted-foreground)]">
              Must be at least 8 characters with uppercase, lowercase, and a number.
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--color-foreground)]">
              Confirm password
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
            Set password
          </button>
        </form>
      </LoadingOverlay>
    </AuthLayout>
  );
}
