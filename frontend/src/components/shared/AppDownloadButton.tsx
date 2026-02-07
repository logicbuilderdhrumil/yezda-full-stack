/**
 * AppDownloadButton – shows App Store / Google Play download badges.
 *
 * Renders one or two platform buttons linking to the mobile app stores.
 */
import { type ReactNode } from 'react';
import { cn } from '@/utils';
import type { AppDownloadButtonProps } from '@/@types/custom-components';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Download badges for mobile app stores.
 *
 * @example
 * ```tsx
 * <AppDownloadButton
 *   appStoreUrl="https://apps.apple.com/app/id123"
 *   playStoreUrl="https://play.google.com/store/apps/details?id=com.example"
 * />
 * ```
 */
export function AppDownloadButton({
  platform = 'both',
  appStoreUrl = '#',
  playStoreUrl = '#',
  className,
}: AppDownloadButtonProps): ReactNode {
  const showIos = platform === 'ios' || platform === 'both';
  const showAndroid = platform === 'android' || platform === 'both';

  return (
    <div className={cn('inline-flex flex-wrap items-center gap-3', className)}>
      {showIos && (
        <a
          href={appStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Download on the App Store"
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-black px-4 py-2 text-white transition-colors',
            'hover:bg-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            'dark:border-gray-600',
          )}
        >
          <AppleIcon />
          <span className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-wide">Download on the</span>
            <span className="text-sm font-semibold">App Store</span>
          </span>
        </a>
      )}

      {showAndroid && (
        <a
          href={playStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Get it on Google Play"
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-black px-4 py-2 text-white transition-colors',
            'hover:bg-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
            'dark:border-gray-600',
          )}
        >
          <PlayStoreIcon />
          <span className="flex flex-col leading-tight">
            <span className="text-[10px] uppercase tracking-wide">Get it on</span>
            <span className="text-sm font-semibold">Google Play</span>
          </span>
        </a>
      )}
    </div>
  );
}

// ============================================================================
// ICONS
// ============================================================================

function AppleIcon(): ReactNode {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function PlayStoreIcon(): ReactNode {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-1.596l2.651 1.535a1 1 0 010 1.708l-2.651 1.535-2.534-2.535 2.534-2.243zM5.864 3.455L16.8 9.788l-2.302 2.302L5.864 3.455z" />
    </svg>
  );
}
