/**
 * System settings view with sections for General, Screening Configuration,
 * Notifications, and Integrations.
 */

import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Bell, Key, Shield } from 'lucide-react';
import { PageContainer } from '@/components/layouts';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { cn } from '@/utils';

// -----------------------------------------------------------------------------
// Default / Mock values
// -----------------------------------------------------------------------------

const DEFAULT_GENERAL = {
  applicationName: 'ScreeningWyse',
  timezone: 'Europe/London',
  defaultLanguage: 'en',
};

const TIMEZONE_OPTIONS = [
  'Europe/London',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Australia/Sydney',
] as const;

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'es', label: 'Spanish' },
] as const;

const DEFAULT_SCREENING = {
  defaultPipeline: '',
  autoAssignEnabled: false,
  autoAssignRole: 'agent',
};

const DEFAULT_NOTIFICATIONS = {
  emailOnScreeningComplete: true,
  emailOnCandidateSubmission: true,
  emailOnNewUser: false,
  inAppAlerts: true,
  weeklyDigest: true,
};

const DEFAULT_INTEGRATIONS = {
  apiKeyPrefix: 'sk_live_****',
  webhooks: [
    { id: '1', url: 'https://example.com/webhook', events: ['screening.completed'], active: true },
  ],
};

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

interface FormFieldProps {
  label: string;
  htmlFor: string;
  description?: string;
  children: ReactNode;
}

function FormField({ label, htmlFor, description, children }: FormFieldProps): ReactNode {
  return (
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </label>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}): ReactNode {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div className="space-y-0.5">
        <div className="text-sm font-medium">{label}</div>
        {description && (
          <div className="text-xs text-muted-foreground">{description}</div>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
          checked ? 'bg-primary' : 'bg-muted'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Section Components
// -----------------------------------------------------------------------------

function GeneralSection(): ReactNode {
  const [general, setGeneral] = useState(DEFAULT_GENERAL);

  const handleSave = () => {
    // TODO: persist to API
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          General Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField label="Application Name" htmlFor="app-name" description="The name displayed in the browser tab and headers">
          <input
            id="app-name"
            type="text"
            value={general.applicationName}
            onChange={(e) => setGeneral({ ...general, applicationName: e.target.value })}
            className="w-full rounded-md border border-border px-3 py-2 text-sm dark:bg-gray-800"
          />
        </FormField>

        <FormField label="Timezone" htmlFor="timezone" description="Default timezone for date displays and scheduling">
          <select
            id="timezone"
            value={general.timezone}
            onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}
            className="w-full rounded-md border border-border px-3 py-2 text-sm dark:bg-gray-800"
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Default Language" htmlFor="language" description="Default interface language for new users">
          <select
            id="language"
            value={general.defaultLanguage}
            onChange={(e) => setGeneral({ ...general, defaultLanguage: e.target.value })}
            className="w-full rounded-md border border-border px-3 py-2 text-sm dark:bg-gray-800"
          >
            {LANGUAGE_OPTIONS.map((lang) => (
              <option key={lang.value} value={lang.value}>{lang.label}</option>
            ))}
          </select>
        </FormField>

        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ScreeningConfigSection(): ReactNode {
  const [config, setConfig] = useState(DEFAULT_SCREENING);

  const handleSave = () => {
    // TODO: persist to API
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Screening Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField label="Default Pipeline" htmlFor="default-pipeline" description="Pipeline assigned to new candidates by default">
          <input
            id="default-pipeline"
            type="text"
            value={config.defaultPipeline}
            onChange={(e) => setConfig({ ...config, defaultPipeline: e.target.value })}
            placeholder="Select a pipeline..."
            className="w-full rounded-md border border-border px-3 py-2 text-sm dark:bg-gray-800"
          />
        </FormField>

        <ToggleField
          label="Auto-Assign Candidates"
          description="Automatically assign new candidates to agents based on workload"
          checked={config.autoAssignEnabled}
          onChange={(checked) => setConfig({ ...config, autoAssignEnabled: checked })}
        />

        {config.autoAssignEnabled && (
          <FormField label="Auto-Assign Role" htmlFor="auto-assign-role" description="Role to auto-assign candidates to">
            <select
              id="auto-assign-role"
              value={config.autoAssignRole}
              onChange={(e) => setConfig({ ...config, autoAssignRole: e.target.value })}
            className="w-full rounded-md border border-border px-3 py-2 text-sm dark:bg-gray-800"
            >
              <option value="platform_agent">Platform Agent</option>
              <option value="platform_manager">Platform Manager</option>
            </select>
          </FormField>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationsSection(): ReactNode {
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);

  const handleSave = () => {
    // TODO: persist to API
  };

  const handleToggle = (key: keyof typeof notifications) => (checked: boolean) => {
    setNotifications({ ...notifications, [key]: checked });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ToggleField
          label="Screening Complete Email"
          description="Send email when a screening is completed"
          checked={notifications.emailOnScreeningComplete}
          onChange={handleToggle('emailOnScreeningComplete')}
        />

        <ToggleField
          label="Candidate Submission Email"
          description="Send email when a new candidate submits an application"
          checked={notifications.emailOnCandidateSubmission}
          onChange={handleToggle('emailOnCandidateSubmission')}
        />

        <ToggleField
          label="New User Registration Email"
          description="Send email when a new user is created"
          checked={notifications.emailOnNewUser}
          onChange={handleToggle('emailOnNewUser')}
        />

        <ToggleField
          label="In-App Alerts"
          description="Show in-app notification alerts for important events"
          checked={notifications.inAppAlerts}
          onChange={handleToggle('inAppAlerts')}
        />

        <ToggleField
          label="Weekly Digest"
          description="Send a weekly summary email of platform activity"
          checked={notifications.weeklyDigest}
          onChange={handleToggle('weeklyDigest')}
        />

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave}>Save Changes</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function IntegrationsSection(): ReactNode {
  const [integrations] = useState(DEFAULT_INTEGRATIONS);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Integrations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Key */}
        <div className="rounded-lg border border-border p-4">
          <h4 className="text-sm font-medium mb-2">API Key</h4>
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono">
              {integrations.apiKeyPrefix}
            </code>
            <Button variant="outline" size="sm">
              Regenerate
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Use this key to authenticate API requests. Keep it secret.
          </p>
        </div>

        {/* Webhooks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Webhooks</h4>
            <Button variant="outline" size="sm">
              Add Webhook
            </Button>
          </div>
          {integrations.webhooks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No webhooks configured yet.
            </p>
          ) : (
            <div className="space-y-2">
              {integrations.webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <div className="text-sm font-medium">{webhook.url}</div>
                    <div className="text-xs text-muted-foreground">
                      Events: {webhook.events.join(', ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-block h-2 w-2 rounded-full',
                        webhook.active ? 'bg-green-500' : 'bg-gray-300'
                      )}
                    />
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Main View
// -----------------------------------------------------------------------------

export function SettingsView(): ReactNode {
  const { t } = useTranslation();

  return (
    <PageContainer
      title={t('settings.title', { defaultValue: 'Settings' })}
      description={t('settings.description', {
        defaultValue: 'Manage application configuration and preferences',
      })}
    >
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="screening">Screening</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSection />
        </TabsContent>

        <TabsContent value="screening">
          <ScreeningConfigSection />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsSection />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsSection />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
