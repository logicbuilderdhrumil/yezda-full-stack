/**
 * Shared utilities for pagination, filtering, and search.
 */

// ============================================================================
// PAGINATION UTILITIES
// ============================================================================

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Paginate an array of items.
 */
export function paginate<T>(
  items: T[],
  { page, pageSize }: PaginationState
): PaginatedResult<T> {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const safePage = Math.min(Math.max(1, page), totalPages || 1);
  const startIndex = (safePage - 1) * pageSize;
  const data = items.slice(startIndex, startIndex + pageSize);

  return {
    data,
    totalItems,
    totalPages,
    page: safePage,
    pageSize,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}

/**
 * Calculate pagination offset for API requests.
 */
export function getPaginationOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

/**
 * Generate page numbers for pagination UI.
 */
export function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  siblingCount: number = 1
): (number | 'ellipsis')[] {
  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, idx) => start + idx);
  };

  const totalPageNumbers = siblingCount * 2 + 5;

  if (totalPages <= totalPageNumbers) {
    return range(1, totalPages);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = 3 + 2 * siblingCount;
    return [...range(1, leftItemCount), 'ellipsis', totalPages];
  }

  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = 3 + 2 * siblingCount;
    return [1, 'ellipsis', ...range(totalPages - rightItemCount + 1, totalPages)];
  }

  return [
    1,
    'ellipsis',
    ...range(leftSiblingIndex, rightSiblingIndex),
    'ellipsis',
    totalPages,
  ];
}

// ============================================================================
// FILTERING UTILITIES
// ============================================================================

export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'in'
  | 'notIn'
  | 'isEmpty'
  | 'isNotEmpty';

export interface FilterCondition<T = unknown> {
  field: string;
  operator: FilterOperator;
  value: T;
  secondValue?: T; // For 'between' operator
}

export interface FilterGroup {
  type: 'and' | 'or';
  conditions: (FilterCondition | FilterGroup)[];
}

/**
 * Get a nested property value from an object.
 */
export function getNestedValue<T>(obj: T, path: string): unknown {
  return path.split('.').reduce((acc: unknown, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

/**
 * Check if a value matches a filter condition.
 */
export function matchesCondition<T>(item: T, condition: FilterCondition): boolean {
  const value = getNestedValue(item, condition.field);
  const filterValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      return value === filterValue;
    case 'notEquals':
      return value !== filterValue;
    case 'contains':
      return String(value ?? '').toLowerCase().includes(String(filterValue).toLowerCase());
    case 'notContains':
      return !String(value ?? '').toLowerCase().includes(String(filterValue).toLowerCase());
    case 'startsWith':
      return String(value ?? '').toLowerCase().startsWith(String(filterValue).toLowerCase());
    case 'endsWith':
      return String(value ?? '').toLowerCase().endsWith(String(filterValue).toLowerCase());
    case 'gt':
      return Number(value) > Number(filterValue);
    case 'gte':
      return Number(value) >= Number(filterValue);
    case 'lt':
      return Number(value) < Number(filterValue);
    case 'lte':
      return Number(value) <= Number(filterValue);
    case 'between':
      return Number(value) >= Number(filterValue) && Number(value) <= Number(condition.secondValue);
    case 'in':
      return Array.isArray(filterValue) && filterValue.includes(value);
    case 'notIn':
      return Array.isArray(filterValue) && !filterValue.includes(value);
    case 'isEmpty':
      return value === null || value === undefined || value === '';
    case 'isNotEmpty':
      return value !== null && value !== undefined && value !== '';
    default:
      return true;
  }
}

/**
 * Check if an item matches a filter group (with AND/OR logic).
 */
export function matchesFilterGroup<T>(item: T, group: FilterGroup): boolean {
  const results = group.conditions.map((condition) => {
    if ('type' in condition) {
      return matchesFilterGroup(item, condition);
    }
    return matchesCondition(item, condition);
  });

  return group.type === 'and' ? results.every(Boolean) : results.some(Boolean);
}

/**
 * Filter an array based on filter conditions.
 */
export function filterItems<T>(
  items: T[],
  conditions: FilterCondition[] | FilterGroup
): T[] {
  if (Array.isArray(conditions)) {
    // Simple AND of all conditions
    return items.filter((item) =>
      conditions.every((condition) => matchesCondition(item, condition))
    );
  }

  // Complex filter group
  return items.filter((item) => matchesFilterGroup(item, conditions));
}

// ============================================================================
// SEARCH UTILITIES
// ============================================================================

export interface SearchOptions {
  /** Fields to search in. */
  fields: string[];
  /** Minimum query length to trigger search. */
  minLength?: number;
  /** Case-sensitive search. */
  caseSensitive?: boolean;
  /** Match mode: 'any' matches any word, 'all' matches all words. */
  matchMode?: 'any' | 'all';
}

/**
 * Search items by a query string.
 */
export function searchItems<T>(
  items: T[],
  query: string,
  options: SearchOptions
): T[] {
  const {
    fields,
    minLength = 1,
    caseSensitive = false,
    matchMode = 'any',
  } = options;

  const trimmedQuery = query.trim();
  if (trimmedQuery.length < minLength) {
    return items;
  }

  const searchTerms = trimmedQuery.split(/\s+/);
  const normalizedTerms = caseSensitive
    ? searchTerms
    : searchTerms.map((t) => t.toLowerCase());

  return items.filter((item) => {
    const fieldValues = fields.map((field) => {
      const value = getNestedValue(item, field);
      const stringValue = String(value ?? '');
      return caseSensitive ? stringValue : stringValue.toLowerCase();
    });

    const matchResults = normalizedTerms.map((term) =>
      fieldValues.some((fieldValue) => fieldValue.includes(term))
    );

    return matchMode === 'all' ? matchResults.every(Boolean) : matchResults.some(Boolean);
  });
}

/**
 * Highlight search matches in text.
 */
export function highlightMatches(
  text: string,
  query: string,
  options: { caseSensitive?: boolean; className?: string } = {}
): string {
  const { caseSensitive = false, className = 'bg-yellow-200 dark:bg-yellow-800' } = options;

  if (!query.trim()) return text;

  const terms = query.trim().split(/\s+/);
  let result = text;

  terms.forEach((term) => {
    const regex = new RegExp(`(${escapeRegExp(term)})`, caseSensitive ? 'g' : 'gi');
    result = result.replace(regex, `<mark class="${className}">$1</mark>`);
  });

  return result;
}

/**
 * Escape special regex characters.
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// SORTING UTILITIES
// ============================================================================

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: string;
  direction: SortDirection;
}

/**
 * Sort items by a field.
 */
export function sortItems<T>(
  items: T[],
  config: SortConfig | SortConfig[]
): T[] {
  const configs = Array.isArray(config) ? config : [config];

  return [...items].sort((a, b) => {
    for (const { field, direction } of configs) {
      const valueA = getNestedValue(a, field);
      const valueB = getNestedValue(b, field);

      let comparison = 0;

      if (valueA === valueB) {
        comparison = 0;
      } else if (valueA == null) {
        comparison = 1;
      } else if (valueB == null) {
        comparison = -1;
      } else if (typeof valueA === 'string' && typeof valueB === 'string') {
        comparison = valueA.localeCompare(valueB);
      } else {
        comparison = valueA < valueB ? -1 : 1;
      }

      if (comparison !== 0) {
        return direction === 'desc' ? -comparison : comparison;
      }
    }

    return 0;
  });
}

// ============================================================================
// EXPORT UTILITIES
// ============================================================================

export interface ExportOptions {
  filename: string;
  format: 'csv' | 'json';
  fields?: string[];
  headers?: Record<string, string>;
}

/**
 * Export data to CSV format.
 */
export function exportToCsv<T extends Record<string, unknown>>(
  data: T[],
  options: Omit<ExportOptions, 'format'>
): string {
  const { fields, headers = {} } = options;

  if (data.length === 0) return '';

  const firstItem = data[0];
  const columns = fields ?? (firstItem ? Object.keys(firstItem) : []);
  const headerRow = columns.map((col) => headers[col] ?? col).join(',');

  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = getNestedValue(item, col);
        const stringValue = String(value ?? '');
        // Escape quotes and wrap in quotes if contains comma
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(',')
  );

  return [headerRow, ...rows].join('\n');
}

/**
 * Export data to JSON format.
 */
export function exportToJson<T>(
  data: T[],
  options: Omit<ExportOptions, 'format'>
): string {
  const { fields } = options;

  if (!fields) {
    return JSON.stringify(data, null, 2);
  }

  const filtered = data.map((item) => {
    const obj: Record<string, unknown> = {};
    fields.forEach((field) => {
      obj[field] = getNestedValue(item, field);
    });
    return obj;
  });

  return JSON.stringify(filtered, null, 2);
}

/**
 * Download data as a file.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export and download data.
 */
export function exportData<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions
): void {
  const { filename, format } = options;

  let content: string;
  let mimeType: string;
  let extension: string;

  if (format === 'csv') {
    content = exportToCsv(data, options);
    mimeType = 'text/csv';
    extension = '.csv';
  } else {
    content = exportToJson(data, options);
    mimeType = 'application/json';
    extension = '.json';
  }

  const fullFilename = filename.endsWith(extension) ? filename : `${filename}${extension}`;
  downloadFile(content, fullFilename, mimeType);
}
