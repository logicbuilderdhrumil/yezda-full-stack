import { useState, useEffect, type ReactNode, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AuthLayout } from './AuthLayout';
import { ErrorMessage, LoadingOverlay } from '@/components/ui';

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
}

function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.password) {
    errors.password = 'Password is required';
  } else if (data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  return errors;
}

/**
 * Sign-in page with email/password form.
 */
export function SignInView(): ReactNode {
  const navigate = useNavigate();
  const { signIn, isLoading, error, clearError, mfaPending } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Redirect to TOTP verification if MFA is required
  useEffect(() => {
    if (mfaPending) {
      navigate('/totp-verify');
    }
  }, [mfaPending, navigate]);

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setTouched({ email: true, password: true });

    if (Object.keys(errors).length > 0) return;

    const success = await signIn(formData);
    if (success) {
      navigate('/');
    }
  };

  return (
    <AuthLayout
      title="Sign in to your account"
      subtitle="Welcome back! Please enter your details."
    >
      <LoadingOverlay isLoading={isLoading} message="Signing in...">
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
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
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

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange('password')}
              onBlur={handleBlur('password')}
              className={`mt-1 block w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
                touched.password && formErrors.password
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-primary focus:ring-primary/20'
              }`}
              placeholder="••••••••"
            />
            {touched.password && formErrors.password && (
              <p className="mt-1.5 text-xs text-red-600">{formErrors.password}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              Remember me
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sign in
          </button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/sign-up" className="font-medium text-primary hover:text-primary/80">
              Sign up
            </Link>
          </p>
        </form>
      </LoadingOverlay>
    </AuthLayout>
  );
}
