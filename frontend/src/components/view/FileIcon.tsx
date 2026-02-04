/**
 * FileIcon component - maps file types to appropriate Lucide icons.
 */
import { type ReactNode, type HTMLAttributes } from 'react';
import {
  File,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  FileJson,
  Presentation,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/utils';

// ============================================================================
// FILE TYPE MAPPINGS
// ============================================================================

/** Mapping of file extensions to icon components */
const FILE_ICON_MAP: Record<string, LucideIcon> = {
  // Documents
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  txt: FileText,
  rtf: FileText,
  odt: FileText,
  md: FileText,

  // Spreadsheets
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  ods: FileSpreadsheet,

  // Presentations
  ppt: Presentation,
  pptx: Presentation,
  odp: Presentation,

  // Images
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
  gif: FileImage,
  svg: FileImage,
  webp: FileImage,
  bmp: FileImage,
  ico: FileImage,
  tiff: FileImage,

  // Videos
  mp4: FileVideo,
  avi: FileVideo,
  mov: FileVideo,
  wmv: FileVideo,
  mkv: FileVideo,
  webm: FileVideo,
  m4v: FileVideo,

  // Audio
  mp3: FileAudio,
  wav: FileAudio,
  ogg: FileAudio,
  flac: FileAudio,
  aac: FileAudio,
  m4a: FileAudio,

  // Code
  js: FileCode,
  ts: FileCode,
  jsx: FileCode,
  tsx: FileCode,
  html: FileCode,
  css: FileCode,
  scss: FileCode,
  less: FileCode,
  py: FileCode,
  java: FileCode,
  c: FileCode,
  cpp: FileCode,
  h: FileCode,
  go: FileCode,
  rs: FileCode,
  rb: FileCode,
  php: FileCode,
  sh: FileCode,
  sql: FileCode,
  yml: FileCode,
  yaml: FileCode,
  xml: FileCode,

  // Data
  json: FileJson,

  // Archives
  zip: FileArchive,
  rar: FileArchive,
  tar: FileArchive,
  gz: FileArchive,
  '7z': FileArchive,
  bz2: FileArchive,
};

/** Mapping of MIME type prefixes to icon components */
const MIME_ICON_MAP: Record<string, LucideIcon> = {
  image: FileImage,
  video: FileVideo,
  audio: FileAudio,
  text: FileText,
  application: File,
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Extract file extension from filename.
 */
function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) {
    return '';
  }
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Get icon component for a given filename or MIME type.
 */
function getFileIcon(filename?: string, mimeType?: string): LucideIcon {
  // Try extension-based mapping first
  if (filename) {
    const ext = getExtension(filename);
    if (ext && FILE_ICON_MAP[ext]) {
      return FILE_ICON_MAP[ext];
    }
  }

  // Fall back to MIME type prefix
  if (mimeType) {
    const prefix = mimeType.split('/')[0];
    if (prefix && MIME_ICON_MAP[prefix]) {
      return MIME_ICON_MAP[prefix];
    }
  }

  // Default to generic file icon
  return File;
}

// ============================================================================
// COMPONENT
// ============================================================================

export interface FileIconProps extends HTMLAttributes<HTMLSpanElement> {
  /** Filename to determine icon type. */
  filename?: string;
  /** MIME type to determine icon type (fallback). */
  mimeType?: string;
  /** Icon size in pixels. */
  size?: number;
  /** Custom icon color. */
  color?: string;
}

/**
 * Displays an appropriate icon based on file type.
 *
 * @example
 * ```tsx
 * <FileIcon filename="report.pdf" size={24} />
 * <FileIcon mimeType="image/png" />
 * <FileIcon filename="data.json" className="text-blue-500" />
 * ```
 */
export function FileIcon({
  filename,
  mimeType,
  size = 20,
  color,
  className,
  ...props
}: FileIconProps): ReactNode {
  const IconComponent = getFileIcon(filename, mimeType);

  return (
    <span
      className={cn('inline-flex items-center justify-center', className)}
      {...props}
    >
      <IconComponent
        size={size}
        color={color}
        aria-hidden="true"
        data-testid="file-icon"
      />
    </span>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { getFileIcon, getExtension, FILE_ICON_MAP, MIME_ICON_MAP };
