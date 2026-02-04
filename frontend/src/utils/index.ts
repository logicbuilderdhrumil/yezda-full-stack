export {
  PASSWORD_MIN_LENGTH,
  PASSWORD_REGEX,
  validatePassword,
  EMAIL_REGEX,
  validateEmail,
} from './validation';
export {
  extractApiError,
  isApiError,
  showErrorToast,
  showSuccessToast,
  handleApiError,
  ErrorCodes,
  type ApiError,
} from './errorHandler';
export {
  generateCSSVariables,
  applyThemeToDocument,
  getThemePreset,
  generateCustomTheme,
  previewTheme,
} from './themeGenerator';
export { cn } from './cn';

// Date/time formatting utilities
export {
  formatDate,
  formatTime,
  formatRelativeTime,
  formatISODate,
  toDate,
  isToday,
  isPast,
  isFuture,
  type DateFormatOptions,
} from './dateTime';

// Pagination and sorting utilities
export {
  paginate,
  sortBy,
  toggleSort,
  createPaginationMeta,
  getOffset,
  getPageNumbers,
  type PaginationMeta,
  type PaginatedResult,
  type SortDirection,
  type SortConfig,
} from './pagination';

// Async utilities
export {
  debounce,
  throttle,
  sleep,
  retry,
  dedupeAsync,
} from './async';

// String utilities
export {
  acronym,
  initials,
  truncate,
  capitalize,
  titleCase,
  kebabCase,
  camelCase,
  pluralize,
  stripHtml,
  isBlank,
  isNotBlank,
} from './string';

// Search utilities
export {
  wildcardToRegex,
  matchWildcard,
  filterByWildcard,
  filterByField,
  createFuzzyMatcher,
  fuzzySearch,
  highlightMatches,
} from './search';

// File utilities
export {
  formatFileSize,
  parseFileSize,
  getFileCategory,
  getFileExtension,
  isPreviewable,
  isWithinSizeLimit,
  isAllowedFileType,
  extractFileMetadata,
  createPreviewUrl,
  generateUniqueFilename,
  calculateUploadProgress,
  FILE_CATEGORIES,
  type FileCategory,
  type FileMetadata,
  type UploadProgress,
} from './fileUtils';
