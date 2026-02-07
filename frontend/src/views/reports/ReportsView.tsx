/**
 * Reports placeholder view.
 * Displays a coming-soon message for the reports & analytics feature.
 */

import { BarChart } from 'lucide-react';

export function ReportsView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-primary/10 p-4 mb-4">
        <BarChart className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Reports &amp; Analytics</h1>
      <p className="text-muted-foreground max-w-md">
        The reports and analytics module is coming soon. You&apos;ll be able to view
        screening statistics, compliance metrics, and custom reports from here.
      </p>
    </div>
  );
}
