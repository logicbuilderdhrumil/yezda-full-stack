import { describe, it, expect } from 'vitest';
import {
  formatFileSize,
  parseFileSize,
  getFileCategory,
  getFileExtension,
  isPreviewable,
  isWithinSizeLimit,
  isAllowedFileType,
  extractFileMetadata,
  generateUniqueFilename,
  calculateUploadProgress,
  FILE_CATEGORIES,
} from './fileUtils';

describe('fileUtils', () => {
  describe('formatFileSize', () => {
    it('formats 0 bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('formats bytes', () => {
      expect(formatFileSize(500)).toBe('500.00 B');
    });

    it('formats kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1536)).toBe('1.50 KB');
    });

    it('formats megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1.00 MB');
      expect(formatFileSize(5242880)).toBe('5.00 MB');
    });

    it('formats gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1.00 GB');
    });

    it('respects decimal places parameter', () => {
      expect(formatFileSize(1536, 0)).toBe('2 KB');
      expect(formatFileSize(1536, 1)).toBe('1.5 KB');
      expect(formatFileSize(1536, 3)).toBe('1.500 KB');
    });

    it('handles negative values', () => {
      expect(formatFileSize(-100)).toBe('Invalid size');
    });
  });

  describe('parseFileSize', () => {
    it('parses bytes', () => {
      expect(parseFileSize('500 B')).toBe(500);
    });

    it('parses kilobytes', () => {
      expect(parseFileSize('1 KB')).toBe(1024);
      expect(parseFileSize('1.5 KB')).toBe(1536);
    });

    it('parses megabytes', () => {
      expect(parseFileSize('1 MB')).toBe(1048576);
    });

    it('is case-insensitive', () => {
      expect(parseFileSize('1 kb')).toBe(1024);
      expect(parseFileSize('1 Kb')).toBe(1024);
    });

    it('returns NaN for invalid input', () => {
      expect(parseFileSize('invalid')).toBeNaN();
      expect(parseFileSize('1 XB')).toBeNaN();
      expect(parseFileSize('')).toBeNaN();
    });
  });

  describe('getFileCategory', () => {
    it('detects image types', () => {
      expect(getFileCategory('image/jpeg')).toBe('image');
      expect(getFileCategory('image/png')).toBe('image');
      expect(getFileCategory('image/gif')).toBe('image');
    });

    it('detects document types', () => {
      expect(getFileCategory('application/pdf')).toBe('document');
      expect(getFileCategory('text/plain')).toBe('document');
      expect(getFileCategory('text/csv')).toBe('document');
    });

    it('detects video types', () => {
      expect(getFileCategory('video/mp4')).toBe('video');
      expect(getFileCategory('video/webm')).toBe('video');
    });

    it('detects audio types', () => {
      expect(getFileCategory('audio/mpeg')).toBe('audio');
      expect(getFileCategory('audio/wav')).toBe('audio');
    });

    it('detects archive types', () => {
      expect(getFileCategory('application/zip')).toBe('archive');
    });

    it('returns other for unknown types', () => {
      expect(getFileCategory('application/unknown')).toBe('other');
      expect(getFileCategory('custom/type')).toBe('other');
    });

    it('is case-insensitive', () => {
      expect(getFileCategory('IMAGE/JPEG')).toBe('image');
      expect(getFileCategory('Application/PDF')).toBe('document');
    });
  });

  describe('getFileExtension', () => {
    it('extracts extension from filename', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('image.PNG')).toBe('png');
    });

    it('handles multiple dots', () => {
      expect(getFileExtension('archive.tar.gz')).toBe('gz');
      expect(getFileExtension('file.name.with.dots.txt')).toBe('txt');
    });

    it('returns empty string for no extension', () => {
      expect(getFileExtension('README')).toBe('');
      expect(getFileExtension('file.')).toBe('');
    });
  });

  describe('isPreviewable', () => {
    it('returns true for images', () => {
      expect(isPreviewable('image/jpeg')).toBe(true);
      expect(isPreviewable('image/png')).toBe(true);
    });

    it('returns true for PDFs', () => {
      expect(isPreviewable('application/pdf')).toBe(true);
    });

    it('returns false for other types', () => {
      expect(isPreviewable('video/mp4')).toBe(false);
      expect(isPreviewable('application/zip')).toBe(false);
      expect(isPreviewable('text/plain')).toBe(false);
    });
  });

  describe('isWithinSizeLimit', () => {
    it('returns true for sizes within limit', () => {
      expect(isWithinSizeLimit(100, 1000)).toBe(true);
      expect(isWithinSizeLimit(1000, 1000)).toBe(true);
      expect(isWithinSizeLimit(0, 1000)).toBe(true);
    });

    it('returns false for sizes exceeding limit', () => {
      expect(isWithinSizeLimit(1001, 1000)).toBe(false);
    });

    it('returns false for negative sizes', () => {
      expect(isWithinSizeLimit(-1, 1000)).toBe(false);
    });
  });

  describe('isAllowedFileType', () => {
    it('matches exact MIME types', () => {
      expect(isAllowedFileType('image/jpeg', ['image/jpeg', 'image/png'])).toBe(true);
      expect(isAllowedFileType('image/gif', ['image/jpeg', 'image/png'])).toBe(false);
    });

    it('matches by category name', () => {
      expect(isAllowedFileType('image/jpeg', ['image'])).toBe(true);
      expect(isAllowedFileType('application/pdf', ['document'])).toBe(true);
      expect(isAllowedFileType('video/mp4', ['image'])).toBe(false);
    });

    it('matches wildcards', () => {
      expect(isAllowedFileType('image/jpeg', ['image/*'])).toBe(true);
      expect(isAllowedFileType('image/png', ['image/*'])).toBe(true);
      expect(isAllowedFileType('video/mp4', ['image/*'])).toBe(false);
    });

    it('is case-insensitive', () => {
      expect(isAllowedFileType('IMAGE/JPEG', ['image/jpeg'])).toBe(true);
    });
  });

  describe('extractFileMetadata', () => {
    it('extracts metadata from File object', () => {
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
        lastModified: 1234567890,
      });

      const metadata = extractFileMetadata(file);

      expect(metadata.name).toBe('test.txt');
      expect(metadata.size).toBe(12); // 'test content' is 12 bytes
      expect(metadata.type).toBe('text/plain');
      expect(metadata.lastModified).toBe(1234567890);
    });

    it('defaults type to application/octet-stream', () => {
      const file = new File(['test'], 'test', { type: '' });
      const metadata = extractFileMetadata(file);
      expect(metadata.type).toBe('application/octet-stream');
    });
  });

  describe('generateUniqueFilename', () => {
    it('generates unique filename with timestamp', () => {
      const result = generateUniqueFilename('document.pdf');
      expect(result).toMatch(/^document_\d+-[a-z0-9]+\.pdf$/);
    });

    it('includes prefix when provided', () => {
      const result = generateUniqueFilename('image.png', 'upload');
      expect(result).toMatch(/^upload_image_\d+-[a-z0-9]+\.png$/);
    });

    it('handles files without extension', () => {
      const result = generateUniqueFilename('README');
      expect(result).toMatch(/^README_\d+-[a-z0-9]+$/);
      expect(result).not.toContain('.');
    });

    it('generates different names for same input', () => {
      const result1 = generateUniqueFilename('file.txt');
      const result2 = generateUniqueFilename('file.txt');
      expect(result1).not.toBe(result2);
    });
  });

  describe('calculateUploadProgress', () => {
    it('calculates percentage correctly', () => {
      expect(calculateUploadProgress(50, 100)).toEqual({
        loaded: 50,
        total: 100,
        percentage: 50,
      });
    });

    it('rounds percentage to nearest integer', () => {
      expect(calculateUploadProgress(33, 100).percentage).toBe(33);
      expect(calculateUploadProgress(67, 100).percentage).toBe(67);
    });

    it('handles 0 total', () => {
      expect(calculateUploadProgress(0, 0)).toEqual({
        loaded: 0,
        total: 0,
        percentage: 0,
      });
    });

    it('handles complete upload', () => {
      expect(calculateUploadProgress(100, 100)).toEqual({
        loaded: 100,
        total: 100,
        percentage: 100,
      });
    });
  });

  describe('FILE_CATEGORIES', () => {
    it('contains expected categories', () => {
      expect(FILE_CATEGORIES).toHaveProperty('image');
      expect(FILE_CATEGORIES).toHaveProperty('document');
      expect(FILE_CATEGORIES).toHaveProperty('video');
      expect(FILE_CATEGORIES).toHaveProperty('audio');
      expect(FILE_CATEGORIES).toHaveProperty('archive');
    });

    it('image category contains common image types', () => {
      expect(FILE_CATEGORIES.image).toContain('image/jpeg');
      expect(FILE_CATEGORIES.image).toContain('image/png');
      expect(FILE_CATEGORIES.image).toContain('image/gif');
    });
  });
});
