/**
 * Shared utilities tests.
 */
import { describe, it, expect } from 'vitest';
import {
  paginate,
  getPaginationOffset,
  generatePageNumbers,
  getNestedValue,
  matchesCondition,
  filterItems,
  searchItems,
  highlightMatches,
  sortItems,
  exportToCsv,
  exportToJson,
} from '../utils';

describe('Pagination utilities', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  describe('paginate', () => {
    it('paginates items correctly', () => {
      const result = paginate(items, { page: 1, pageSize: 3 });
      expect(result.data).toEqual([1, 2, 3]);
      expect(result.totalItems).toBe(10);
      expect(result.totalPages).toBe(4);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(false);
    });

    it('returns correct data for middle pages', () => {
      const result = paginate(items, { page: 2, pageSize: 3 });
      expect(result.data).toEqual([4, 5, 6]);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
    });

    it('returns correct data for last page', () => {
      const result = paginate(items, { page: 4, pageSize: 3 });
      expect(result.data).toEqual([10]);
      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
    });

    it('clamps page to valid range', () => {
      const result = paginate(items, { page: 100, pageSize: 3 });
      expect(result.page).toBe(4);
    });

    it('handles empty array', () => {
      const result = paginate([], { page: 1, pageSize: 10 });
      expect(result.data).toEqual([]);
      expect(result.totalPages).toBe(0);
    });
  });

  describe('getPaginationOffset', () => {
    it('calculates offset correctly', () => {
      expect(getPaginationOffset(1, 10)).toBe(0);
      expect(getPaginationOffset(2, 10)).toBe(10);
      expect(getPaginationOffset(3, 25)).toBe(50);
    });
  });

  describe('generatePageNumbers', () => {
    it('generates all pages when total is small', () => {
      expect(generatePageNumbers(1, 5)).toEqual([1, 2, 3, 4, 5]);
    });

    it('generates pages with ellipsis for large totals', () => {
      const pages = generatePageNumbers(5, 10);
      expect(pages).toContain(1);
      expect(pages).toContain(10);
      expect(pages).toContain('ellipsis');
    });
  });
});

describe('Filter utilities', () => {
  describe('getNestedValue', () => {
    it('gets simple property', () => {
      expect(getNestedValue({ name: 'Alice' }, 'name')).toBe('Alice');
    });

    it('gets nested property', () => {
      expect(getNestedValue({ user: { name: 'Bob' } }, 'user.name')).toBe('Bob');
    });

    it('returns undefined for missing path', () => {
      expect(getNestedValue({ name: 'Alice' }, 'email')).toBeUndefined();
    });
  });

  describe('matchesCondition', () => {
    const item = { name: 'Alice', age: 30, email: 'alice@example.com' };

    it('matches equals', () => {
      expect(matchesCondition(item, { field: 'name', operator: 'equals', value: 'Alice' })).toBe(true);
      expect(matchesCondition(item, { field: 'name', operator: 'equals', value: 'Bob' })).toBe(false);
    });

    it('matches notEquals', () => {
      expect(matchesCondition(item, { field: 'name', operator: 'notEquals', value: 'Bob' })).toBe(true);
    });

    it('matches contains', () => {
      expect(matchesCondition(item, { field: 'email', operator: 'contains', value: 'example' })).toBe(true);
    });

    it('matches startsWith', () => {
      expect(matchesCondition(item, { field: 'email', operator: 'startsWith', value: 'alice' })).toBe(true);
    });

    it('matches numeric comparisons', () => {
      expect(matchesCondition(item, { field: 'age', operator: 'gt', value: 25 })).toBe(true);
      expect(matchesCondition(item, { field: 'age', operator: 'lt', value: 25 })).toBe(false);
      expect(matchesCondition(item, { field: 'age', operator: 'gte', value: 30 })).toBe(true);
    });

    it('matches in operator', () => {
      expect(matchesCondition(item, { field: 'name', operator: 'in', value: ['Alice', 'Bob'] })).toBe(true);
      expect(matchesCondition(item, { field: 'name', operator: 'in', value: ['Bob', 'Charlie'] })).toBe(false);
    });

    it('matches isEmpty/isNotEmpty', () => {
      expect(matchesCondition({ name: '' }, { field: 'name', operator: 'isEmpty', value: null })).toBe(true);
      expect(matchesCondition(item, { field: 'name', operator: 'isNotEmpty', value: null })).toBe(true);
    });
  });

  describe('filterItems', () => {
    const items = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
      { name: 'Charlie', age: 35 },
    ];

    it('filters by single condition', () => {
      const result = filterItems(items, [
        { field: 'age', operator: 'gt', value: 28 },
      ]);
      expect(result).toHaveLength(2);
      expect(result.map(i => i.name)).toEqual(['Alice', 'Charlie']);
    });

    it('filters by multiple conditions (AND)', () => {
      const result = filterItems(items, [
        { field: 'age', operator: 'gt', value: 24 },
        { field: 'name', operator: 'startsWith', value: 'A' },
      ]);
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Alice');
    });
  });
});

describe('Search utilities', () => {
  const items = [
    { id: 1, title: 'Introduction to React', author: 'Alice' },
    { id: 2, title: 'Vue Basics', author: 'Bob' },
    { id: 3, title: 'React Hooks Guide', author: 'Charlie' },
  ];

  describe('searchItems', () => {
    it('searches in specified fields', () => {
      const result = searchItems(items, 'react', { fields: ['title'] });
      expect(result).toHaveLength(2);
    });

    it('matches any word by default', () => {
      const result = searchItems(items, 'Introduction Vue', { fields: ['title'] });
      expect(result).toHaveLength(2);
    });

    it('matches all words when matchMode is all', () => {
      const result = searchItems(items, 'Introduction Vue', {
        fields: ['title'],
        matchMode: 'all',
      });
      expect(result).toHaveLength(0);
    });

    it('respects minLength', () => {
      const result = searchItems(items, 'a', { fields: ['title'], minLength: 2 });
      expect(result).toHaveLength(3); // Returns all because query is too short
    });
  });

  describe('highlightMatches', () => {
    it('highlights matching text', () => {
      const result = highlightMatches('Hello World', 'world');
      expect(result).toContain('<mark');
      expect(result).toContain('World');
    });

    it('handles multiple terms', () => {
      const result = highlightMatches('Hello World Today', 'hello today');
      expect(result).toMatch(/<mark.*>Hello<\/mark>/);
      expect(result).toMatch(/<mark.*>Today<\/mark>/);
    });

    it('returns original for empty query', () => {
      expect(highlightMatches('Hello', '')).toBe('Hello');
    });
  });
});

describe('Sorting utilities', () => {
  describe('sortItems', () => {
    const items = [
      { name: 'Charlie', age: 35 },
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ];

    it('sorts ascending', () => {
      const result = sortItems(items, { field: 'name', direction: 'asc' });
      expect(result.map(i => i.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('sorts descending', () => {
      const result = sortItems(items, { field: 'age', direction: 'desc' });
      expect(result.map(i => i.name)).toEqual(['Charlie', 'Alice', 'Bob']);
    });

    it('sorts by multiple fields', () => {
      const itemsWithDupes = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Alice', age: 25 },
      ];
      const result = sortItems(itemsWithDupes, [
        { field: 'name', direction: 'asc' },
        { field: 'age', direction: 'asc' },
      ]);
      expect(result[0]).toEqual({ name: 'Alice', age: 25 });
      expect(result[1]).toEqual({ name: 'Alice', age: 30 });
    });

    it('handles null values', () => {
      const itemsWithNull = [
        { name: 'Bob', age: 25 },
        { name: null, age: 30 },
        { name: 'Alice', age: 35 },
      ];
      const result = sortItems(itemsWithNull, { field: 'name', direction: 'asc' });
      expect(result[2]?.name).toBeNull();
    });
  });
});

describe('Export utilities', () => {
  describe('exportToCsv', () => {
    it('exports data to CSV format', () => {
      const data = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ];
      const csv = exportToCsv(data, { filename: 'test' });
      expect(csv).toContain('name,age');
      expect(csv).toContain('Alice,30');
      expect(csv).toContain('Bob,25');
    });

    it('escapes commas and quotes', () => {
      const data = [
        { name: 'Alice, Jr.', bio: 'Said "hello"' },
      ];
      const csv = exportToCsv(data, { filename: 'test' });
      expect(csv).toContain('"Alice, Jr."');
      expect(csv).toContain('"Said ""hello"""');
    });

    it('uses custom headers', () => {
      const data = [{ name: 'Alice' }];
      const csv = exportToCsv(data, {
        filename: 'test',
        headers: { name: 'Full Name' },
      });
      expect(csv).toContain('Full Name');
    });

    it('exports only specified fields', () => {
      const data = [
        { name: 'Alice', age: 30, email: 'alice@test.com' },
      ];
      const csv = exportToCsv(data, {
        filename: 'test',
        fields: ['name', 'email'],
      });
      expect(csv).toContain('name,email');
      expect(csv).not.toContain('age');
    });
  });

  describe('exportToJson', () => {
    it('exports data to JSON format', () => {
      const data = [{ name: 'Alice' }];
      const json = exportToJson(data, { filename: 'test' });
      expect(JSON.parse(json)).toEqual(data);
    });

    it('exports only specified fields', () => {
      const data = [{ name: 'Alice', age: 30 }];
      const json = exportToJson(data, {
        filename: 'test',
        fields: ['name'],
      });
      const parsed = JSON.parse(json);
      expect(parsed[0]).toEqual({ name: 'Alice' });
    });
  });
});
