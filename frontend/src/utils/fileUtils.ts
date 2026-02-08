/**
 * File utility helpers for size formatting, type detection, and preview support.
 */

/** File size units for formatting. */
const FILE_SIZE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/** Common MIME type categories. */
export const FILE_CATEGORIES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
  ],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/gzip'],
} as const;

/** Supported file category type. */
export type FileCategory = keyof typeof FILE_CATEGORIES | 'other';

/** File metadata interface. */
export interface FileMetadata {
  /** Original file name. */
  name: string;
  /** File size in bytes. */
  size: number;
  /** MIME type of the file. */
  type: string;
  /** Last modified timestamp. */
  lastModified: number;
}

/** Upload progress information. */
export interface UploadProgress {
  /** Bytes uploaded so far. */
  loaded: number;
  /** Total bytes to upload. */
  total: number;
  /** Upload progress as percentage (0-100). */
  percentage: number;
}

/**
 * Formats a file size in bytes to a human-readable string.
 * @param bytes - The file size in bytes.
 * @param decimals - Number of decimal places (default: 2).
 * @returns Formatted file size string (e.g., "1.5 MB").
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  if (bytes < 0) return 'Invalid size';

  const k = 1024;
  const dm = Math.max(0, decimals);
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const unitIndex = Math.min(i, FILE_SIZE_UNITS.length - 1);

  const size = bytes / Math.pow(k, unitIndex);
  return `${size.toFixed(dm)} ${FILE_SIZE_UNITS[unitIndex]}`;
}

/**
 * Parses a formatted file size string back to bytes.
 * @param sizeStr - Formatted size string (e.g., "1.5 MB").
 * @returns Size in bytes, or NaN if invalid.
 */
export function parseFileSize(sizeStr: string): number {
  const match = sizeStr.trim().match(/^([\d.]+)\s*([A-Z]+)$/i);
  if (!match) return NaN;

  const value = parseFloat(match[1]!);
  const unit = match[2]!.toUpperCase();
  const unitIndex = FILE_SIZE_UNITS.indexOf(unit as typeof FILE_SIZE_UNITS[number]);

  if (unitIndex === -1 || isNaN(value)) return NaN;

  return value * Math.pow(1024, unitIndex);
}

/**
 * Detects the category of a file based on its MIME type.
 * @param mimeType - The MIME type of the file.
 * @returns The file category.
 */
export function getFileCategory(mimeType: string): FileCategory {
  const normalizedType = mimeType.toLowerCase();

  for (const [category, types] of Object.entries(FILE_CATEGORIES)) {
    if ((types as readonly string[]).includes(normalizedType)) {
      return category as FileCategory;
    }
  }

  return 'other';
}

/**
 * Gets the file extension from a filename or MIME type.
 * @param filename - The filename or path.
 * @returns The file extension (lowercase, without dot) or empty string.
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Checks if a file type is supported for preview.
 * @param mimeType - The MIME type to check.
 * @returns True if the file can be previewed in the browser.
 */
export function isPreviewable(mimeType: string): boolean {
  const category = getFileCategory(mimeType);
  return category === 'image' || mimeType === 'application/pdf';
}

/**
 * Validates file size against a maximum limit.
 * @param size - File size in bytes.
 * @param maxSize - Maximum allowed size in bytes.
 * @returns True if file size is within limit.
 */
export function isWithinSizeLimit(size: number, maxSize: number): boolean {
  return size >= 0 && size <= maxSize;
}

/**
 * Validates file type against allowed types.
 * @param mimeType - The MIME type to validate.
 * @param allowedTypes - Array of allowed MIME types or categories.
 * @returns True if the file type is allowed.
 */
export function isAllowedFileType(mimeType: string, allowedTypes: string[]): boolean {
  const normalizedType = mimeType.toLowerCase();

  for (const allowed of allowedTypes) {
    // Direct MIME type match
    if (normalizedType === allowed.toLowerCase()) return true;

    // Category match (e.g., "image" matches all image types)
    if (allowed in FILE_CATEGORIES) {
      const categoryTypes = FILE_CATEGORIES[allowed as keyof typeof FILE_CATEGORIES];
      if ((categoryTypes as readonly string[]).includes(normalizedType)) return true;
    }

    // Wildcard match (e.g., "image/*")
    if (allowed.endsWith('/*')) {
      const prefix = allowed.slice(0, -1);
      if (normalizedType.startsWith(prefix)) return true;
    }
  }

  return false;
}

/**
 * Extracts metadata from a File object.
 * @param file - The File object.
 * @returns File metadata.
 */
export function extractFileMetadata(file: File): FileMetadata {
  return {
    name: file.name,
    size: file.size,
    type: file.type || 'application/octet-stream',
    lastModified: file.lastModified,
  };
}

/**
 * Creates a preview URL for a file (images and PDFs).
 * Remember to revoke the URL when done using URL.revokeObjectURL().
 * @param file - The File object.
 * @returns Object URL for preview, or null if not previewable.
 */
export function createPreviewUrl(file: File): string | null {
  if (!isPreviewable(file.type)) return null;
  return URL.createObjectURL(file);
}

/**
 * Generates a unique filename to avoid collisions.
 * @param originalName - The original filename.
 * @param prefix - Optional prefix to add.
 * @returns A unique filename with timestamp.
 */
export function generateUniqueFilename(originalName: string, prefix?: string): string {
  const extension = getFileExtension(originalName);
  const lastDotIndex = originalName.lastIndexOf('.');
  const baseName = lastDotIndex === -1 ? originalName : originalName.slice(0, lastDotIndex);
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);

  const parts = [prefix, baseName, `${timestamp}-${random}`].filter(Boolean);
  const newName = parts.join('_');

  return extension ? `${newName}.${extension}` : newName;
}

/**
 * Calculates upload progress from loaded and total bytes.
 * @param loaded - Bytes uploaded.
 * @param total - Total bytes.
 * @returns Upload progress object.
 */
export function calculateUploadProgress(loaded: number, total: number): UploadProgress {
  const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
  return { loaded, total, percentage };
}
