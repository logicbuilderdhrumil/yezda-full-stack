/**
 * Pagination Contracts
 * Consistent pagination primitives for list endpoints.
 */

/**
 * Pagination request parameters.
 */
export interface PaginationParams {
  /** Number of items to return (default: 20, max: 100) */
  limit?: number;
  /** Opaque cursor for next page */
  cursor?: string;
  /** Offset-based pagination (alternative to cursor) */
  offset?: number;
}

/**
 * Pagination metadata in response.
 */
export interface PaginationMeta {
  /** Total number of items (when available) */
  total?: number;
  /** Number of items in current page */
  count: number;
  /** Whether there are more items */
  hasMore: boolean;
  /** Cursor for next page (cursor-based pagination) */
  nextCursor?: string;
  /** Current offset (offset-based pagination) */
  offset?: number;
  /** Items per page */
  limit: number;
}

/**
 * Paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  /** List of items */
  data: T[];
  /** Pagination metadata */
  pagination: PaginationMeta;
}

/**
 * Sort direction for list endpoints.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort parameters for list endpoints.
 */
export interface SortParams<TField extends string = string> {
  /** Field to sort by */
  field: TField;
  /** Sort direction */
  direction: SortDirection;
}

/**
 * Creates pagination metadata from array and params.
 */
export function createPaginationMeta<T>(
  items: T[],
  params: PaginationParams,
  total?: number
): PaginationMeta {
  const limit = params.limit || 20;
  const count = items.length;
  const hasMore = count >= limit;

  return {
    total,
    count,
    hasMore,
    limit,
    offset: params.offset,
  };
}
