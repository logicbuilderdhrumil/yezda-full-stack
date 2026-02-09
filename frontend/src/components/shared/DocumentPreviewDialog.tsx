/**
 * DocumentPreviewDialog – modal for previewing uploaded documents.
 *
 * Supports PDF (iframe), images (img), and a generic download fallback.
 */
import { type ReactNode } from 'react';
import { cn } from '@/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import type { DocumentPreviewDialogProps } from '@/@types/custom-components';

// ============================================================================
// HELPERS
// ============================================================================

/** Determine the document category from its MIME type or extension. */
function getDocumentCategory(type: string): 'pdf' | 'image' | 'other' {
  const lower = type.toLowerCase();
  if (lower === 'application/pdf' || lower.endsWith('.pdf') || lower === 'pdf') {
    return 'pdf';
  }
  if (
    lower.startsWith('image/') ||
    ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'].some((ext) => lower.endsWith(ext))
  ) {
    return 'image';
  }
  return 'other';
}

/** Format bytes to a human-readable string. */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Friendly label for the type badge. */
function typeBadgeLabel(type: string): string {
  const category = getDocumentCategory(type);
  if (category === 'pdf') return 'PDF';
  if (category === 'image') return 'Image';
  // Fallback: strip "application/" prefix or show raw
  return type.replace(/^application\//, '').toUpperCase();
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Dialog for previewing a document (PDF, image, or generic file).
 *
 * @example
 * ```tsx
 * <DocumentPreviewDialog
 *   isOpen={isPreviewOpen}
 *   onClose={() => setPreviewOpen(false)}
 *   document={{ name: 'report.pdf', type: 'application/pdf', url: '/files/report.pdf', size: 204800 }}
 * />
 * ```
 */
export function DocumentPreviewDialog({
  isOpen,
  onClose,
  document,
}: DocumentPreviewDialogProps): ReactNode {
  const category = getDocumentCategory(document.type);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          'max-w-2xl',
          category !== 'other' && 'max-h-[90vh]',
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <FileIcon />
            <span className="truncate">{document.name}</span>
          </DialogTitle>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-sm text-gray-500 dark:text-gray-400">
            <Badge variant="outline" className="text-xs">
              {typeBadgeLabel(document.type)}
            </Badge>
            {document.size !== undefined && (
              <span>{formatFileSize(document.size)}</span>
            )}
            {document.createdAt && (
              <span>
                {new Date(document.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Preview area */}
        <div className="flex-1 overflow-auto">
          {category === 'pdf' && (
            <iframe
              src={document.url}
              title={document.name}
              className="h-[60vh] w-full rounded-md border border-gray-200 dark:border-gray-700"
            />
          )}

          {category === 'image' && (
            <img
              src={document.url}
              alt={document.name}
              className="mx-auto max-h-[60vh] rounded-md object-contain"
            />
          )}

          {category === 'other' && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <GenericFileIcon />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Preview is not available for this file type.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button asChild>
            <a href={document.url} download={document.name} target="_blank" rel="noopener noreferrer">
              <DownloadIcon />
              Download
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// ICONS
// ============================================================================

function FileIcon(): ReactNode {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function DownloadIcon(): ReactNode {
  return (
    <svg
      className="mr-1.5 h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
      />
    </svg>
  );
}

function GenericFileIcon(): ReactNode {
  return (
    <svg
      className="h-16 w-16 text-gray-300 dark:text-gray-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}
