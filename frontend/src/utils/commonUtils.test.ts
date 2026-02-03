import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Date/time utilities
import {
  formatDate,
  formatTime,
  formatISODate,
  toDate,
  isToday,
  isPast,
  isFuture,
} from './dateTime';

// Pagination utilities
import {
  paginate,
  sortBy,
  toggleSort,
  createPaginationMeta,
  getOffset,
  getPageNumbers,
} from './pagination';

// Async utilities
import { debounce, throttle, sleep } from './async';

// String utilities
import {
  acronym,
  initials,
  truncate,
  capitalize,
  titleCase,
  kebabCase,
  camelCase,
  pluralize,
  isBlank,
  isNotBlank,
} from './string';

// Search utilities
import {
  wildcardToRegex,
  matchWildcard,
  filterByWildcard,
  createFuzzyMatcher,
  highlightMatches,
} from './search';

describe('Date/Time Utilities', () => {
  describe('toDate', () => {
    it('should return the same Date object', () => {
      const date = new Date('2026-01-15');
      expect(toDate(date)).toBe(date);
    });

    it('should parse a string into a Date', () => {
      const result = toDate('2026-01-15');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2026);
    });

    it('should handle timestamps', () => {
      const timestamp = Date.now();
      const result = toDate(timestamp);
      expect(result.getTime()).toBe(timestamp);
    });
  });

  describe('formatISODate', () => {
    it('should format a Date as YYYY-MM-DD', () => {
      const date = new Date('2026-01-15T12:00:00Z');
      expect(formatISODate(date)).toBe('2026-01-15');
    });
  });

  describe('formatDate', () => {
    it('should format a date with default options', () => {
      const date = new Date('2026-01-15T12:30:00');
      const result = formatDate(date);
      expect(result).toContain('2026');
      expect(result).toContain('15');
    });

    it('should include time when requested', () => {
      const date = new Date('2026-01-15T14:30:00');
      const result = formatDate(date, { includeTime: true });
      expect(result).toContain('30');
    });
  });

  describe('formatTime', () => {
    it('should format only the time portion', () => {
      const date = new Date('2026-01-15T14:30:00');
      const result = formatTime(date);
      expect(result).toMatch(/\d{1,2}:\d{2}/);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      expect(isToday(new Date())).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isToday(yesterday)).toBe(false);
    });
  });

  describe('isPast', () => {
    it('should return true for past dates', () => {
      const past = new Date(Date.now() - 1000);
      expect(isPast(past)).toBe(true);
    });

    it('should return false for future dates', () => {
      const future = new Date(Date.now() + 10000);
      expect(isPast(future)).toBe(false);
    });
  });

  describe('isFuture', () => {
    it('should return true for future dates', () => {
      const future = new Date(Date.now() + 10000);
      expect(isFuture(future)).toBe(true);
    });

    it('should return false for past dates', () => {
      const past = new Date(Date.now() - 1000);
      expect(isFuture(past)).toBe(false);
    });
  });
});

describe('Pagination Utilities', () => {
  describe('createPaginationMeta', () => {
    it('should calculate correct pagination metadata', () => {
      const meta = createPaginationMeta(2, 10, 35);
      expect(meta.page).toBe(2);
      expect(meta.pageSize).toBe(10);
      expect(meta.total).toBe(35);
      expect(meta.totalPages).toBe(4);
      expect(meta.hasPrevious).toBe(true);
      expect(meta.hasNext).toBe(true);
    });

    it('should handle edge case of first page', () => {
      const meta = createPaginationMeta(1, 10, 35);
      expect(meta.hasPrevious).toBe(false);
      expect(meta.hasNext).toBe(true);
    });

    it('should handle edge case of last page', () => {
      const meta = createPaginationMeta(4, 10, 35);
      expect(meta.hasPrevious).toBe(true);
      expect(meta.hasNext).toBe(false);
    });

    it('should clamp page to valid range', () => {
      const meta = createPaginationMeta(10, 10, 35);
      expect(meta.page).toBe(4);
    });
  });

  describe('paginate', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    it('should return the correct page of items', () => {
      const result = paginate(items, 1, 3);
      expect(result.items).toEqual([1, 2, 3]);
      expect(result.meta.totalPages).toBe(4);
    });

    it('should return the last partial page', () => {
      const result = paginate(items, 4, 3);
      expect(result.items).toEqual([10]);
    });
  });

  describe('sortBy', () => {
    const items = [
      { name: 'Charlie', age: 30 },
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 35 },
    ];

    it('should sort by string field ascending', () => {
      const result = sortBy(items, { field: 'name', direction: 'asc' });
      expect(result.map((i) => i.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should sort by string field descending', () => {
      const result = sortBy(items, { field: 'name', direction: 'desc' });
      expect(result.map((i) => i.name)).toEqual(['Charlie', 'Bob', 'Alice']);
    });

    it('should sort by numeric field', () => {
      const result = sortBy(items, { field: 'age', direction: 'asc' });
      expect(result.map((i) => i.age)).toEqual([25, 30, 35]);
    });

    it('should not mutate the original array', () => {
      const original = [...items];
      sortBy(items, { field: 'name', direction: 'asc' });
      expect(items).toEqual(original);
    });
  });

  describe('toggleSort', () => {
    it('should set initial sort direction', () => {
      const result = toggleSort(undefined, 'name');
      expect(result).toEqual({ field: 'name', direction: 'asc' });
    });

    it('should toggle direction for same field', () => {
      const current = { field: 'name' as const, direction: 'asc' as const };
      const result = toggleSort(current, 'name');
      expect(result).toEqual({ field: 'name', direction: 'desc' });
    });

    it('should reset direction for different field', () => {
      const current = { field: 'name' as const, direction: 'desc' as const };
      const result = toggleSort(current, 'age');
      expect(result).toEqual({ field: 'age', direction: 'asc' });
    });
  });

  describe('getOffset', () => {
    it('should calculate correct offset', () => {
      expect(getOffset(1, 10)).toBe(0);
      expect(getOffset(2, 10)).toBe(10);
      expect(getOffset(3, 25)).toBe(50);
    });

    it('should handle invalid page numbers', () => {
      expect(getOffset(0, 10)).toBe(0);
      expect(getOffset(-1, 10)).toBe(0);
    });
  });

  describe('getPageNumbers', () => {
    it('should return all pages when under max', () => {
      expect(getPageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should include ellipsis for many pages', () => {
      const result = getPageNumbers(5, 10);
      expect(result).toContain(1);
      expect(result).toContain(10);
      expect(result).toContain(-1); // ellipsis marker
    });
  });
});

describe('Async Utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('debounce', () => {
    it('should delay function execution', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on subsequent calls', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      vi.advanceTimersByTime(50);
      debounced();
      vi.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should support cancellation', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced.cancel();
      vi.advanceTimersByTime(200);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe('throttle', () => {
    it('should execute immediately on first call', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should limit execution frequency', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('sleep', () => {
    it('should resolve after specified time', async () => {
      const promise = sleep(100);
      vi.advanceTimersByTime(100);
      await expect(promise).resolves.toBeUndefined();
    });
  });
});

describe('String Utilities', () => {
  describe('acronym', () => {
    it('should create acronyms from words', () => {
      expect(acronym('World Health Organization')).toBe('WHO');
      expect(acronym('United States of America', 4)).toBe('USOA');
    });

    it('should handle empty strings', () => {
      expect(acronym('')).toBe('');
      expect(acronym('   ')).toBe('');
    });

    it('should respect maxLength', () => {
      expect(acronym('One Two Three Four', 2)).toBe('OT');
    });
  });

  describe('initials', () => {
    it('should extract initials from names', () => {
      expect(initials('John Doe')).toBe('JD');
      expect(initials('John')).toBe('J');
      expect(initials('Mary Jane Watson')).toBe('MW');
    });

    it('should handle empty strings', () => {
      expect(initials('')).toBe('');
    });
  });

  describe('truncate', () => {
    it('should truncate long strings', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...');
    });

    it('should not truncate short strings', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('should handle custom suffix', () => {
      expect(truncate('Hello World', 8, '…')).toBe('Hello W…');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('hello world')).toBe('Hello world');
    });

    it('should handle empty strings', () => {
      expect(capitalize('')).toBe('');
    });
  });

  describe('titleCase', () => {
    it('should convert to title case', () => {
      expect(titleCase('hello world')).toBe('Hello World');
      expect(titleCase('HELLO WORLD')).toBe('Hello World');
    });
  });

  describe('kebabCase', () => {
    it('should convert to kebab-case', () => {
      expect(kebabCase('Hello World')).toBe('hello-world');
      expect(kebabCase('camelCase')).toBe('camel-case');
      expect(kebabCase('snake_case')).toBe('snake-case');
    });
  });

  describe('camelCase', () => {
    it('should convert to camelCase', () => {
      expect(camelCase('hello-world')).toBe('helloWorld');
      expect(camelCase('Hello World')).toBe('helloWorld');
      expect(camelCase('snake_case')).toBe('snakeCase');
    });
  });

  describe('pluralize', () => {
    it('should return singular for count of 1', () => {
      expect(pluralize(1, 'item')).toBe('item');
    });

    it('should return plural for count != 1', () => {
      expect(pluralize(0, 'item')).toBe('items');
      expect(pluralize(5, 'item')).toBe('items');
    });

    it('should use custom plural form', () => {
      expect(pluralize(2, 'person', 'people')).toBe('people');
    });
  });

  describe('isBlank / isNotBlank', () => {
    it('should detect blank strings', () => {
      expect(isBlank('')).toBe(true);
      expect(isBlank('   ')).toBe(true);
      expect(isBlank(null)).toBe(true);
      expect(isBlank(undefined)).toBe(true);
      expect(isBlank('hello')).toBe(false);
    });

    it('should detect non-blank strings', () => {
      expect(isNotBlank('hello')).toBe(true);
      expect(isNotBlank('')).toBe(false);
      expect(isNotBlank(null)).toBe(false);
    });
  });
});

describe('Search Utilities', () => {
  describe('wildcardToRegex', () => {
    it('should convert * to match any characters', () => {
      const regex = wildcardToRegex('*.txt');
      expect(regex.test('file.txt')).toBe(true);
      expect(regex.test('another.txt')).toBe(true);
      expect(regex.test('file.md')).toBe(false);
    });

    it('should convert ? to match single character', () => {
      const regex = wildcardToRegex('test?');
      expect(regex.test('tests')).toBe(true);
      expect(regex.test('test1')).toBe(true);
      expect(regex.test('testing')).toBe(false);
    });

    it('should be case-insensitive by default', () => {
      const regex = wildcardToRegex('*.TXT');
      expect(regex.test('file.txt')).toBe(true);
    });

    it('should support case-sensitive mode', () => {
      const regex = wildcardToRegex('*.TXT', { caseSensitive: true });
      expect(regex.test('file.txt')).toBe(false);
      expect(regex.test('file.TXT')).toBe(true);
    });
  });

  describe('matchWildcard', () => {
    it('should match text against wildcard patterns', () => {
      expect(matchWildcard('file.txt', '*.txt')).toBe(true);
      expect(matchWildcard('test123', 'test*')).toBe(true);
      expect(matchWildcard('tests', 'test?')).toBe(true);
      expect(matchWildcard('testing', 'test?')).toBe(false);
    });
  });

  describe('filterByWildcard', () => {
    it('should filter array by wildcard pattern', () => {
      const items = ['foo.txt', 'bar.md', 'baz.txt'];
      expect(filterByWildcard(items, '*.txt')).toEqual(['foo.txt', 'baz.txt']);
    });
  });

  describe('createFuzzyMatcher', () => {
    it('should match if all query characters appear in order', () => {
      const matches = createFuzzyMatcher('fle');
      expect(matches('file')).toBe(true);
      // 'folder' contains f-l-e in order (f-o-l-d-e-r)
      expect(matches('folder')).toBe(true);
      // 'fox' does not contain 'l' or 'e' after 'f'
      expect(matches('fox')).toBe(false);
    });

    it('should be case-insensitive by default', () => {
      const matches = createFuzzyMatcher('ABC');
      expect(matches('abc')).toBe(true);
    });
  });

  describe('highlightMatches', () => {
    it('should return segments with match indicators', () => {
      const result = highlightMatches('Hello World', 'wor');
      // The result should have at least one matching segment containing 'W', 'o', 'r'
      expect(result.some((s) => s.match)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return original text if no query', () => {
      const result = highlightMatches('Hello', '');
      expect(result).toEqual([{ text: 'Hello', match: false }]);
    });
  });
});
