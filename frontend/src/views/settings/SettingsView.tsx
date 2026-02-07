/**
 * Settings placeholder view.
 * Displays a coming-soon message for the system settings feature.
 */

import { Settings } from 'lucide-react';

export function SettingsView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <Settings className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold mb-2">System Settings</h1>
      <p className="text-muted-foreground max-w-md">
        System settings are coming soon. You&apos;ll be able to configure
        application preferences, integrations, and system-wide options from here.
      </p>
    </div>
  );
}
