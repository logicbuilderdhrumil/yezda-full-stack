/**
 * Pagination Utilities
 * Standardized pagination, search, and list response formatting for APIs.
 */

import { z, ZodSchema } from 'zod';

// ============================================================================
// Configuration - Limits and Defaults
// ============================================================================

/** Default page size when not specified */
export const DEFAULT_PAGE_SIZE = 20;

/** Maximum allowed page size */
export const MAX_PAGE_SIZE = 100;

/** Maximum allowed page number to prevent resource exhaustion */
export const MAX_PAGE_NUMBER = 10000;

/** Maximum search query length */
export const MAX_SEARCH_LENGTH = 256;

// ============================================================================
// Pagination Schemas
// ============================================================================

/**
 * Pagination parameters schema.
 * Validates and coerces query parameters for paginated endpoints.
 */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = val ? parseInt(val, 10) : 1;
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    })
    .refine((val) => val <= MAX_PAGE_NUMBER, {
      message: `Page number cannot exceed ${MAX_PAGE_NUMBER}`,
    }),
  size: z
    .string()
    .optional()
    .transform((val) => {
      const parsed = val ? parseInt(val, 10) : DEFAULT_PAGE_SIZE;
      return isNaN(parsed) || parsed < 1 ? DEFAULT_PAGE_SIZE : parsed;
    })
    .refine((val) => val <= MAX_PAGE_SIZE, {
      message: `Page size cannot exceed ${MAX_PAGE_SIZE}`,
    }),
});

/**
 * Search parameters schema.
 * Validates optional search query with length limits.
 */
export const searchSchema = z.object({
  q: z
    .string()
    .max(MAX_SEARCH_LENGTH, `Search query cannot exceed ${MAX_SEARCH_LENGTH} characters`)
    .optional()
    .transform((val) => val?.trim() || undefined),
});

/**
 * Sort parameters schema.
 * Validates sort field and direction.
 */
export const sortSchema = z.object({
  sortBy: z.string().max(64).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

/**
 * Combined pagination, search, and sort schema.
 */
export const listQuerySchema = paginationSchema.merge(searchSchema).merge(sortSchema);

// ============================================================================
// Types
// ============================================================================

export type PaginationParams = z.infer<typeof paginationSchema>;
export type SearchParams = z.infer<typeof searchSchema>;
export type SortParams = z.infer<typeof sortSchema>;
export type ListQueryParams = z.infer<typeof listQuerySchema>;

/**
 * Pagination metadata included in list responses.
 */
export interface PaginationMeta {
  /** Current page number (1-based) */
  page: number;
  /** Number of items per page */
  size: number;
  /** Total number of items across all pages */
  total: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Whether there is a previous page */
  hasPrev: boolean;
}

/**
 * Standard list response envelope.
 */
export interface ListResponse<T> {
  /** Array of items for the current page */
  items: T[];
  /** Pagination metadata */
  pagination: PaginationMeta;
}

/**
 * Error response envelope for list utilities.
 */
export interface ListErrorResponse {
  error: string;
  code: string;
  details?: Array<{ path: string; message: string }>;
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Build pagination metadata from query params and total count.
 */
export function buildPaginationMeta(
  page: number,
  size: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / size) || 1;
  const safePage = Math.min(page, totalPages);

  return {
    page: safePage,
    size,
    total,
    totalPages,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

/**
 * Build a standardized list response envelope.
 */
export function buildListResponse<T>(
  items: T[],
  pagination: PaginationMeta
): ListResponse<T> {
  return {
    items,
    pagination,
  };
}

/**
 * Calculate SQL offset from page and size.
 */
export function calculateOffset(page: number, size: number): number {
  return (page - 1) * size;
}

/**
 * Build a list response from items and query params.
 * Convenience function combining offset calculation and response building.
 */
export function createListResponse<T>(
  items: T[],
  total: number,
  params: PaginationParams
): ListResponse<T> {
  const pagination = buildPaginationMeta(params.page, params.size, total);
  return buildListResponse(items, pagination);
}

// ============================================================================
// Error Sanitization
// ============================================================================

/**
 * Sanitized error codes for list operations.
 */
export const ListErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  LIST_FAILED: 'LIST_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/**
 * Create a sanitized error response for list utilities.
 * Removes sensitive information from error messages.
 */
export function createListError(
  message: string,
  code: keyof typeof ListErrorCodes,
  details?: Array<{ path: string; message: string }>
): ListErrorResponse {
  // Sanitize message - don't expose internal details
  const safeMessage =
    code === 'INTERNAL_ERROR' ? 'An unexpected error occurred' : message;

  return {
    error: safeMessage,
    code,
    ...(details && { details }),
  };
}

/**
 * Convert Zod validation errors to a sanitized error response.
 */
export function zodToListError(error: z.ZodError): ListErrorResponse {
  const details = error.errors.map((e) => ({
    path: e.path.join('.'),
    message: e.message,
  }));

  return createListError('Validation failed', 'VALIDATION_ERROR', details);
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Parse and validate list query parameters.
 * Returns validated params or throws with sanitized error.
 */
export function parseListQuery(query: unknown): ListQueryParams {
  const result = listQuerySchema.safeParse(query);
  if (!result.success) {
    throw zodToListError(result.error);
  }
  return result.data;
}

/**
 * Create a custom list query schema with allowed sort fields.
 */
export function createListQuerySchema<T extends readonly string[]>(
  allowedSortFields: T
): ZodSchema {
  return listQuerySchema.extend({
    sortBy: z.enum(allowedSortFields as unknown as [string, ...string[]]).optional(),
  });
}
