/**
 * Avatar Upload Component
 * Task 1.4: Add avatar or profile image upload
 */
import { useState, useRef, type ReactNode, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/utils';
import { Button, LoadingSpinner, toastError } from '@/components/ui';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface AvatarUploadProps {
  /** Current avatar URL. */
  avatarUrl?: string | undefined;
  /** User's display name for initials. */
  displayName: string;
  /** Called when a new file is selected. */
  onUpload: (file: File) => Promise<void>;
  /** Called when avatar is removed. */
  onRemove: () => Promise<void>;
  /** Whether any avatar operation is in progress. */
  isLoading?: boolean;
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Generates initials from a display name.
 */
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

/**
 * AvatarUpload provides avatar display with upload and remove controls.
 */
export function AvatarUpload({
  avatarUrl,
  displayName,
  onUpload,
  onRemove,
  isLoading = false,
  className,
}: AvatarUploadProps): ReactNode {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = async (file: File): Promise<void> => {
    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toastError(t('account.avatar.invalidType'));
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toastError(t('account.avatar.tooLarge'));
      return;
    }

    await onUpload(file);
  };

  const handleInputChange = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent): void => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent): Promise<void> => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const handleUploadClick = (): void => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleUploadClick();
    }
  };

  return (
    <div className={cn('flex items-center gap-6', className)}>
      {/* Avatar display */}
      <div
        className={cn(
          'relative flex h-24 w-24 items-center justify-center rounded-full',
          'border-2 border-dashed transition-colors cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 dark:border-gray-600',
          avatarUrl && 'border-solid border-transparent'
        )}
        role="button"
        tabIndex={isLoading ? -1 : 0}
        aria-label={t('account.avatar.uploadLabel')}
        onClick={handleUploadClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <span className="text-2xl font-medium text-gray-500 dark:text-gray-400">
            {getInitials(displayName)}
          </span>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <LoadingSpinner className="h-8 w-8 text-white" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={isLoading}
          >
            {t('account.avatar.upload')}
          </Button>
          {avatarUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={isLoading}
            >
              {t('account.avatar.remove')}
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('account.avatar.hint')}
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleInputChange}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
