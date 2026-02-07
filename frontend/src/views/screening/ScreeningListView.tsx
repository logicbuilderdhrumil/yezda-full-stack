/**
 * Screening list placeholder view.
 * Displays a coming-soon message for the screening management feature.
 */

import { Shield } from 'lucide-react';

export function ScreeningListView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <Shield className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Screening Management</h1>
      <p className="text-muted-foreground max-w-md">
        The screening management module is coming soon. You&apos;ll be able to manage
        background checks, verifications, and screening workflows from here.
      </p>
    </div>
  );
}
