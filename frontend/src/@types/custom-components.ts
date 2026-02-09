/**
 * Type definitions for custom reusable components.
 */

// ============================================================================
// ORGANIZATION SELECTOR
// ============================================================================

/** Lightweight organization record for the selector dropdown. */
export interface OrganizationOption {
  /** Unique organization ID. */
  id: string;
  /** Display name. */
  name: string;
  /** Optional logo/avatar URL. */
  logoUrl?: string;
  /** Optional member count for context. */
  memberCount?: number;
}

/** Props for the OrganizationSelector component. */
export interface OrganizationSelectorProps {
  /** List of organizations available for selection. */
  organizations: OrganizationOption[];
  /** Currently selected organization ID. */
  selectedOrgId: string;
  /** Callback when an organization is selected. */
  onSelect: (orgId: string) => void;
  /** Disable the selector. */
  disabled?: boolean;
  /** Placeholder text when nothing is selected. */
  placeholder?: string;
  /** Additional CSS class names. */
  className?: string;
}

// ============================================================================
// DOCUMENT PREVIEW
// ============================================================================

/** Document metadata for the preview dialog. */
export interface DocumentInfo {
  /** Document file name. */
  name: string;
  /** MIME type or file extension (e.g. 'application/pdf', 'image/png'). */
  type: string;
  /** URL to access / download the document. */
  url: string;
  /** File size in bytes. */
  size?: number;
  /** ISO date string of creation. */
  createdAt?: string;
}

/** Props for the DocumentPreviewDialog component. */
export interface DocumentPreviewDialogProps {
  /** Whether the dialog is open. */
  isOpen: boolean;
  /** Callback to close the dialog. */
  onClose: () => void;
  /** Document to preview. */
  document: DocumentInfo;
}

// ============================================================================
// APP DOWNLOAD BUTTON
// ============================================================================

/** Target platform for the download button. */
export type AppPlatform = 'ios' | 'android' | 'both';

/** Props for the AppDownloadButton component. */
export interface AppDownloadButtonProps {
  /** Which platform(s) to show. Defaults to 'both'. */
  platform?: AppPlatform;
  /** Apple App Store URL. */
  appStoreUrl?: string;
  /** Google Play Store URL. */
  playStoreUrl?: string;
  /** Additional CSS class names. */
  className?: string;
}

// ============================================================================
// ONLINE STATUS INDICATOR
// ============================================================================

/** Possible online presence states. */
export type OnlineStatus = 'online' | 'offline' | 'away' | 'busy';

/** Props for the OnlineStatusIndicator component. */
export interface OnlineStatusIndicatorProps {
  /** Current status. */
  status: OnlineStatus;
  /** Dot size. */
  size?: 'sm' | 'md' | 'lg';
  /** Show a text label next to the dot. */
  showLabel?: boolean;
  /** Additional CSS class names. */
  className?: string;
}
