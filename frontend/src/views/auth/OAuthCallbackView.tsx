/**
 * OAuth Callback View
 * Task 1.2, 1.3, 1.4, 1.6: Handle OAuth callback verification UI states
 */
import { useEffect, useState, type ReactNode } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from './AuthLayout';
import { LoadingSpinner, toastSuccess, toastError } from '@/components/ui';
import { OAuthService } from '@/services';
import type { OAuthCallbackResult, OAuthProvider } from '@/@types/oauth';

type VerificationState = 'loading' | 'success' | 'error';

interface VerificationStatus {
  state: VerificationState;
  message: string;
  provider?: OAuthProvider | undefined;
  redirectUrl?: string | undefined;
}

/**
 * OAuth callback verification page.
 * Handles the redirect from OAuth providers after authorization.
 */
export function OAuthCallbackView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { provider } = useParams<{ provider: string }>();
  const [status, setStatus] = useState<VerificationStatus>({
    state: 'loading',
    message: t('oauth.verifying'),
  });

  useEffect(() => {
    const verifyCallback = (): void => {
      // Parse callback parameters
      const result: OAuthCallbackResult = OAuthService.parseCallbackParams(searchParams);

      // Override provider from URL if present
      if (provider) {
        result.provider = provider as OAuthProvider;
      }

      if (result.success) {
        setStatus({
          state: 'success',
          message: t('oauth.connectionSuccess', { provider: result.provider ?? 'Integration' }),
          provider: result.provider,
          redirectUrl: result.redirectUrl,
        });
        toastSuccess(
          t('oauth.connectionSuccess', { provider: result.provider ?? 'Integration' })
        );
      } else {
        setStatus({
          state: 'error',
          message: result.error ?? t('oauth.connectionFailed'),
          provider: result.provider,
        });
        toastError(result.error ?? t('oauth.connectionFailed'));
      }
    };

    // Small delay to prevent flash
    const timer = setTimeout(verifyCallback, 500);
    return () => clearTimeout(timer);
  }, [searchParams, provider, t]);

  const handleContinue = (): void => {
    if (status.redirectUrl) {
      navigate(status.redirectUrl);
    } else {
      navigate('/account/integrations');
    }
  };

  const handleRetry = (): void => {
    navigate('/account/integrations');
  };

  return (
    <AuthLayout
      title={t('oauth.verificationTitle')}
      subtitle={t('oauth.verificationSubtitle')}
    >
      <div className="flex flex-col items-center justify-center py-8">
        {status.state === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <LoadingSpinner className="h-12 w-12 text-primary" />
            <p className="text-sm text-gray-600">{status.message}</p>
          </div>
        )}

        {status.state === 'success' && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t('oauth.successTitle')}
              </h2>
              <p className="mt-1 text-sm text-gray-600">{status.message}</p>
            </div>
            <button
              onClick={handleContinue}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {t('oauth.continue')}
            </button>
          </div>
        )}

        {status.state === 'error' && (
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {t('oauth.errorTitle')}
              </h2>
              <p className="mt-1 text-sm text-gray-600">{status.message}</p>
            </div>
            <button
              onClick={handleRetry}
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {t('oauth.tryAgain')}
            </button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
