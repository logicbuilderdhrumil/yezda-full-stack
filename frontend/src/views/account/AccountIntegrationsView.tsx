/**
 * Account Integrations View
 * Task 1.5: Display and manage OAuth integration status
 */
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LoadingSpinner,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  toastError,
  toastPromise,
} from '@/components/ui';
import { OAuthService } from '@/services';
import type { IntegrationStatus, OAuthProvider } from '@/@types/oauth';

/** Provider display configuration */
const PROVIDER_CONFIG: Record<
  OAuthProvider,
  { displayName: string; description: string; icon: ReactNode }
> = {
  google: {
    displayName: 'Google',
    description: 'Connect your Google account for calendar and drive access.',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
  },
  microsoft: {
    displayName: 'Microsoft',
    description: 'Connect your Microsoft account for Outlook and OneDrive.',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M11.4 24H0V12.6h11.4V24z" fill="#F1511B" />
        <path d="M24 24H12.6V12.6H24V24z" fill="#80CC28" />
        <path d="M11.4 11.4H0V0h11.4v11.4z" fill="#00ADEF" />
        <path d="M24 11.4H12.6V0H24v11.4z" fill="#FBBC09" />
      </svg>
    ),
  },
  slack: {
    displayName: 'Slack',
    description: 'Connect Slack for notifications and team updates.',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.123 2.521a2.528 2.528 0 0 1 2.521-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.521V8.834zm-1.272 0a2.528 2.528 0 0 1-2.521 2.521 2.528 2.528 0 0 1-2.521-2.521V2.522A2.528 2.528 0 0 1 15.164 0a2.528 2.528 0 0 1 2.521 2.522v6.312zm-2.521 10.123a2.528 2.528 0 0 1 2.521 2.521A2.528 2.528 0 0 1 15.164 24a2.528 2.528 0 0 1-2.521-2.522v-2.521h2.521zm0-1.272a2.528 2.528 0 0 1-2.521-2.521 2.528 2.528 0 0 1 2.521-2.521h6.313A2.528 2.528 0 0 1 24 15.164a2.528 2.528 0 0 1-2.522 2.521h-6.313z" fill="#E01E5A" />
      </svg>
    ),
  },
  github: {
    displayName: 'GitHub',
    description: 'Connect GitHub for repository and issue tracking.',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z"
        />
      </svg>
    ),
  },
};

interface IntegrationCardProps {
  provider: OAuthProvider;
  status: IntegrationStatus | null;
  onConnect: (provider: OAuthProvider) => void;
  onDisconnect: (provider: OAuthProvider) => void;
  isLoading: boolean;
}

function IntegrationCard({
  provider,
  status,
  onConnect,
  onDisconnect,
  isLoading,
}: IntegrationCardProps): ReactNode {
  const { t } = useTranslation();
  const config = PROVIDER_CONFIG[provider];
  const isConnected = status?.connected ?? false;
  const hasError = status?.hasError ?? false;

  return (
    <Card className="flex items-center justify-between p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50">
          {config.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900">{config.displayName}</h3>
            {isConnected && !hasError && (
              <Badge variant="success">{t('oauth.connected')}</Badge>
            )}
            {isConnected && hasError && (
              <Badge variant="warning">{t('oauth.error')}</Badge>
            )}
          </div>
          <p className="mt-0.5 text-sm text-gray-600">{config.description}</p>
          {status?.providerAccountId && (
            <p className="mt-1 text-xs text-gray-500">
              {t('oauth.connectedAs', { account: status.providerAccountId })}
            </p>
          )}
          {hasError && status?.errorMessage && (
            <p className="mt-1 text-xs text-red-600">{status.errorMessage}</p>
          )}
        </div>
      </div>
      <div>
        {isConnected ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDisconnect(provider)}
            disabled={isLoading}
          >
            {t('oauth.disconnect')}
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={() => onConnect(provider)}
            disabled={isLoading}
          >
            {t('oauth.connect')}
          </Button>
        )}
      </div>
    </Card>
  );
}

/**
 * Account integrations management page.
 */
export function AccountIntegrationsView(): ReactNode {
  const { t } = useTranslation();
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [availableProviders, setAvailableProviders] = useState<OAuthProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<OAuthProvider | null>(null);

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        const [providers, statuses] = await Promise.all([
          OAuthService.getProviders(),
          OAuthService.getAllStatuses(),
        ]);
        setAvailableProviders(providers);
        setIntegrations(statuses);
      } catch {
        toastError(t('oauth.loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [t]);

  const handleConnect = async (provider: OAuthProvider): Promise<void> => {
    setActionLoading(provider);
    try {
      const response = await OAuthService.authorize(provider);
      // Redirect to OAuth provider
      window.location.href = response.authorizationUrl;
    } catch {
      toastError(t('oauth.connectError', { provider: PROVIDER_CONFIG[provider].displayName }));
      setActionLoading(null);
    }
  };

  const handleDisconnect = async (provider: OAuthProvider): Promise<void> => {
    setActionLoading(provider);
    const displayName = PROVIDER_CONFIG[provider].displayName;

    await toastPromise(
      OAuthService.disconnect(provider),
      {
        loading: t('oauth.disconnecting', { provider: displayName }),
        success: t('oauth.disconnected', { provider: displayName }),
        error: t('oauth.disconnectError', { provider: displayName }),
      }
    );

    // Refresh statuses
    try {
      const statuses = await OAuthService.getAllStatuses();
      setIntegrations(statuses);
    } catch {
      // Status might be stale but disconnect succeeded
    }
    setActionLoading(null);
  };

  const getStatusForProvider = (provider: OAuthProvider): IntegrationStatus | null => {
    return integrations.find((i) => i.provider === provider) ?? null;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('oauth.integrationsTitle')}</CardTitle>
          <CardDescription>{t('oauth.integrationsDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableProviders.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              {t('oauth.noProviders')}
            </p>
          ) : (
            availableProviders.map((provider) => (
              <IntegrationCard
                key={provider}
                provider={provider}
                status={getStatusForProvider(provider)}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                isLoading={actionLoading === provider}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
