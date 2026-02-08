import { useState, type ReactNode, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { validatePassword } from '@/utils/validation';
import { AuthLayout } from './AuthLayout';
import { ErrorMessage, LoadingOverlay } from '@/components/ui';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  termsAccepted?: string;
}

function useFormValidation(t: (key: string) => string) {
  return (data: FormData): FormErrors => {
    const errors: FormErrors = {};

    if (!data.firstName.trim()) {
      errors.firstName = t('auth.validation.firstNameRequired');
    }

    if (!data.lastName.trim()) {
      errors.lastName = t('auth.validation.lastNameRequired');
    }

    if (!data.email.trim()) {
      errors.email = t('auth.validation.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = t('auth.validation.emailInvalid');
    }

    const passwordError = validatePassword(data.password);
    if (passwordError) {
      errors.password = passwordError;
    }

    if (!data.confirmPassword) {
      errors.confirmPassword = t('auth.validation.confirmPasswordRequired');
    } else if (data.password !== data.confirmPassword) {
      errors.confirmPassword = t('auth.validation.passwordsMismatch');
    }

    if (!data.termsAccepted) {
      errors.termsAccepted = t('auth.validation.termsRequired');
    }

    return errors;
  };
}

/**
 * Sign-up page with registration form.
 */
export function SignUpView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUp, isLoading, error, clearError } = useAuth();
  const validateForm = useFormValidation(t);

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
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
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      confirmPassword: true,
      termsAccepted: true,
    });

    if (Object.keys(errors).length > 0) return;

    const success = await signUp({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
      termsAccepted: formData.termsAccepted,
    });

    if (success) {
      navigate('/');
    }
  };

  return (
    <AuthLayout
      title={t('auth.signUpTitle')}
      subtitle={t('auth.signUpSubtitle')}
    >
      <LoadingOverlay isLoading={isLoading} message={t('auth.creatingAccount')}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorMessage error={error} onDismiss={clearError} className="mb-4" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                {t('auth.firstNameLabel')}
              </label>
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                value={formData.firstName}
                onChange={handleChange('firstName')}
                onBlur={handleBlur('firstName')}
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
                  touched.firstName && formErrors.firstName
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-primary focus:ring-primary/20'
                }`}
                placeholder={t('auth.firstNamePlaceholder')}
              />
              {touched.firstName && formErrors.firstName && (
                <p className="mt-1 text-xs text-red-600">{formErrors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                {t('auth.lastNameLabel')}
              </label>
              <input
                id="lastName"
                type="text"
                autoComplete="family-name"
                value={formData.lastName}
                onChange={handleChange('lastName')}
                onBlur={handleBlur('lastName')}
                className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
                  touched.lastName && formErrors.lastName
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-primary focus:ring-primary/20'
                }`}
                placeholder={t('auth.lastNamePlaceholder')}
              />
              {touched.lastName && formErrors.lastName && (
                <p className="mt-1 text-xs text-red-600">{formErrors.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {t('auth.emailLabel')}
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
                touched.email && formErrors.email
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-primary focus:ring-primary/20'
              }`}
              placeholder={t('auth.emailPlaceholder')}
            />
            {touched.email && formErrors.email && (
              <p className="mt-1 text-xs text-red-600">{formErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              {t('auth.passwordLabel')}
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange('password')}
              onBlur={handleBlur('password')}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
                touched.password && formErrors.password
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-primary focus:ring-primary/20'
              }`}
              placeholder={t('auth.passwordPlaceholder')}
            />
            {touched.password && formErrors.password && (
              <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              {t('auth.confirmPasswordLabel')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm transition focus:outline-none focus:ring-2 ${
                touched.confirmPassword && formErrors.confirmPassword
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                  : 'border-gray-300 focus:border-primary focus:ring-primary/20'
              }`}
              placeholder={t('auth.passwordPlaceholder')}
            />
            {touched.confirmPassword && formErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{formErrors.confirmPassword}</p>
            )}
          </div>

          <div className="flex items-start gap-2">
            <input
              id="terms"
              type="checkbox"
              checked={formData.termsAccepted}
              onChange={handleChange('termsAccepted')}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="terms" className="text-sm text-gray-600">
              {t('auth.termsAgree')}{' '}
              <Link to="/terms" className="font-medium text-primary hover:text-primary/80">
                {t('auth.termsOfService')}
              </Link>{' '}
              {t('auth.and')}{' '}
              <Link to="/privacy" className="font-medium text-primary hover:text-primary/80">
                {t('auth.privacyPolicy')}
              </Link>
            </label>
          </div>
          {touched.termsAccepted && formErrors.termsAccepted && (
            <p className="text-xs text-red-600">{formErrors.termsAccepted}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('auth.createAccount')}
          </button>

          <p className="text-center text-sm text-gray-600">
            {t('auth.hasAccount')}{' '}
            <Link to="/sign-in" className="font-medium text-primary hover:text-primary/80">
              {t('auth.signIn')}
            </Link>
          </p>
        </form>
      </LoadingOverlay>
    </AuthLayout>
  );
}
