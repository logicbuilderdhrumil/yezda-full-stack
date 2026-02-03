/**
 * Pagination and sorting helpers.
 */

/**
 * Pagination metadata.
 */
export interface PaginationMeta {
  /** Current page (1-indexed) */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a previous page */
  hasPrevious: boolean;
  /** Whether there is a next page */
  hasNext: boolean;
}

/**
 * Paginated result wrapper.
 */
export interface PaginatedResult<T> {
  /** The items for the current page */
  items: T[];
  /** Pagination metadata */
  meta: PaginationMeta;
}

/**
 * Sort direction.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort configuration.
 */
export interface SortConfig<K extends string = string> {
  /** Field to sort by */
  field: K;
  /** Sort direction */
  direction: SortDirection;
}

/**
 * Creates pagination metadata.
 * @param page - Current page (1-indexed)
 * @param pageSize - Items per page
 * @param total - Total number of items
 * @returns Pagination metadata
 */
export function createPaginationMeta(page: number, pageSize: number, total: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const normalizedPage = Math.max(1, Math.min(page, totalPages));

  return {
    page: normalizedPage,
    pageSize,
    total,
    totalPages,
    hasPrevious: normalizedPage > 1,
    hasNext: normalizedPage < totalPages,
  };
}

/**
 * Paginates an array of items.
 * @param items - Array of items to paginate
 * @param page - Current page (1-indexed)
 * @param pageSize - Items per page
 * @returns Paginated result with items and metadata
 */
export function paginate<T>(items: T[], page: number, pageSize: number): PaginatedResult<T> {
  const total = items.length;
  const meta = createPaginationMeta(page, pageSize, total);
  const start = (meta.page - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: items.slice(start, end),
    meta,
  };
}

/**
 * Sorts an array of objects by a key.
 * @param items - Array of items to sort
 * @param config - Sort configuration
 * @returns Sorted array (new array, does not mutate original)
 */
export function sortBy<T extends Record<string, unknown>>(
  items: T[],
  config: SortConfig<Extract<keyof T, string>>
): T[] {
  const { field, direction } = config;
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...items].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    // Handle null/undefined
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return multiplier;
    if (bVal == null) return -multiplier;

    // String comparison
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return multiplier * aVal.localeCompare(bVal);
    }

    // Numeric comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return multiplier * (aVal - bVal);
    }

    // Date comparison
    if (aVal instanceof Date && bVal instanceof Date) {
      return multiplier * (aVal.getTime() - bVal.getTime());
    }

    // Fallback to string comparison
    return multiplier * String(aVal).localeCompare(String(bVal));
  });
}

/**
 * Toggles sort direction or sets initial direction.
 * @param current - Current sort config (or undefined for initial sort)
 * @param field - Field to sort by
 * @param defaultDirection - Default direction when sorting a new field
 * @returns New sort configuration
 */
export function toggleSort<K extends string>(
  current: SortConfig<K> | undefined,
  field: K,
  defaultDirection: SortDirection = 'asc'
): SortConfig<K> {
  if (!current || current.field !== field) {
    return { field, direction: defaultDirection };
  }

  return {
    field,
    direction: current.direction === 'asc' ? 'desc' : 'asc',
  };
}

/**
 * Gets the offset for a given page.
 * @param page - Page number (1-indexed)
 * @param pageSize - Items per page
 * @returns Offset for database queries
 */
export function getOffset(page: number, pageSize: number): number {
  return Math.max(0, (page - 1) * pageSize);
}

/**
 * Generates an array of page numbers for pagination UI.
 * @param currentPage - Current page (1-indexed)
 * @param totalPages - Total number of pages
 * @param maxVisible - Maximum visible page numbers
 * @returns Array of page numbers and ellipsis markers (-1)
 */
export function getPageNumbers(
  currentPage: number,
  totalPages: number,
  maxVisible = 7
): number[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: number[] = [];
  const sideWidth = Math.floor((maxVisible - 3) / 2);

  // Always show first page
  pages.push(1);

  // Calculate range around current page
  let rangeStart = Math.max(2, currentPage - sideWidth);
  let rangeEnd = Math.min(totalPages - 1, currentPage + sideWidth);

  // Adjust range if near edges
  if (currentPage <= sideWidth + 2) {
    rangeEnd = Math.min(totalPages - 1, maxVisible - 2);
  } else if (currentPage >= totalPages - sideWidth - 1) {
    rangeStart = Math.max(2, totalPages - maxVisible + 3);
  }

  // Add ellipsis or pages before range
  if (rangeStart > 2) {
    pages.push(-1); // ellipsis marker
  }

  // Add range
  for (let i = rangeStart; i <= rangeEnd; i++) {
    pages.push(i);
  }

  // Add ellipsis or pages after range
  if (rangeEnd < totalPages - 1) {
    pages.push(-1); // ellipsis marker
  }

  // Always show last page
  pages.push(totalPages);

  return pages;
}
