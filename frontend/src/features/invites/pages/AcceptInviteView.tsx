/**
 * AcceptInviteView — public page for accepting an invite via token link.
 *
 * URL: /accept-invite?token=<token>
 *
 * Flow:
 * 1. User clicks invite link in email
 * 2. Page validates the token
 * 3. Shows invite details (organization name, type)
 * 4. User clicks "Accept" to join
 * 5. On success, redirects to appropriate location
 */
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  LoadingSpinner,
} from '@/components/ui';
import { InviteService } from '@/features/invites/services/InviteService';
import type { InviteValidation } from '@/@types/invite';

/**
 * AcceptInviteView handles the invite acceptance flow.
 */
export function AcceptInviteView(): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');

  const [validation, setValidation] = useState<InviteValidation | null>(null);
  const [isValidating, setIsValidating] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const validateToken = useCallback(async () => {
    if (!token) {
      setError('missing_token');
      setIsValidating(false);
      return;
    }

    try {
      const result = await InviteService.validateToken(token);
      setValidation(result);
      if (!result.valid) {
        setError(result.error || 'invalid');
      }
    } catch {
      setError('invalid');
    } finally {
      setIsValidating(false);
    }
  }, [token]);

  useEffect(() => {
    validateToken();
  }, [validateToken]);

  const handleAccept = async () => {
    if (!token) return;

    setIsAccepting(true);
    setError(null);

    try {
      const result = await InviteService.acceptInvite(token);
      setAccepted(true);

      // Redirect after a brief delay
      setTimeout(() => {
        navigate(result.redirectUrl || '/');
      }, 2000);
    } catch (err) {
      const apiErr = err as { response?: { data?: { code?: string } } };
      const code = apiErr?.response?.data?.code;
      if (code === 'ALREADY_ACCEPTED') {
        setError('already_accepted');
      } else if (code === 'EXPIRED') {
        setError('expired');
      } else {
        setError('accept_failed');
      }
    } finally {
      setIsAccepting(false);
    }
  };

  // Loading state
  if (isValidating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <LoadingSpinner className="h-8 w-8" />
            <p className="text-sm text-muted-foreground">
              {t('invites.accept.validating')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error states
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <CardTitle>{t(`invites.accept.error.${error}.title`)}</CardTitle>
            <CardDescription>
              {t(`invites.accept.error.${error}.description`)}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/login')}>
              {t('invites.accept.goToLogin')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (accepted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle>{t('invites.accept.success.title')}</CardTitle>
            <CardDescription>
              {t('invites.accept.success.description', {
                organization: validation?.organizationName,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              {t('invites.accept.success.redirecting')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Valid invite — show accept form
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <CardTitle>{t('invites.accept.title')}</CardTitle>
          <CardDescription>
            {t('invites.accept.description', {
              organization: validation?.organizationName,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t('invites.accept.organization')}
              </span>
              <span className="text-sm font-medium text-foreground">
                {validation?.organizationName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t('invites.accept.type')}
              </span>
              <Badge variant="secondary">
                {t(`invites.accept.typeLabel.${validation?.type}`)}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t('invites.accept.email')}
              </span>
              <span className="text-sm font-medium text-foreground">
                {validation?.email}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleAccept}
              disabled={isAccepting}
              className="w-full"
              size="lg"
            >
              {isAccepting ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  {t('invites.accept.accepting')}
                </>
              ) : (
                t('invites.accept.acceptButton')
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="w-full"
            >
              {t('invites.accept.decline')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
