/**
 * Search and filter helpers.
 */

/**
 * Converts a wildcard pattern to a regular expression.
 * Supports * (any characters) and ? (single character) wildcards.
 *
 * @param pattern - The wildcard pattern
 * @param options - Pattern options
 * @returns RegExp for the pattern
 *
 * @example
 * wildcardToRegex('*.txt').test('file.txt') // true
 * wildcardToRegex('test?').test('tests') // true
 */
export function wildcardToRegex(
  pattern: string,
  options: { caseSensitive?: boolean } = {}
): RegExp {
  const { caseSensitive = false } = options;

  // Escape special regex characters except * and ?
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');

  // Replace wildcards with regex equivalents
  const regexPattern = escaped.replace(/\*/g, '.*').replace(/\?/g, '.');

  return new RegExp(`^${regexPattern}$`, caseSensitive ? '' : 'i');
}

/**
 * Tests if a string matches a wildcard pattern.
 *
 * @param text - The text to test
 * @param pattern - The wildcard pattern
 * @param options - Match options
 * @returns True if the text matches the pattern
 *
 * @example
 * matchWildcard('file.txt', '*.txt') // true
 * matchWildcard('test123', 'test*') // true
 * matchWildcard('tests', 'test?') // true
 */
export function matchWildcard(
  text: string,
  pattern: string,
  options: { caseSensitive?: boolean } = {}
): boolean {
  const regex = wildcardToRegex(pattern, options);
  return regex.test(text);
}

/**
 * Filters an array of items using a wildcard pattern.
 *
 * @param items - Array of items to filter
 * @param pattern - The wildcard pattern
 * @param options - Filter options
 * @returns Filtered array of matching items
 *
 * @example
 * filterByWildcard(['foo.txt', 'bar.md'], '*.txt') // ['foo.txt']
 */
export function filterByWildcard(
  items: string[],
  pattern: string,
  options: { caseSensitive?: boolean } = {}
): string[] {
  const regex = wildcardToRegex(pattern, options);
  return items.filter((item) => regex.test(item));
}

/**
 * Filters an array of objects by a field using a wildcard pattern.
 *
 * @param items - Array of items to filter
 * @param field - Field to match against
 * @param pattern - The wildcard pattern
 * @param options - Filter options
 * @returns Filtered array of matching items
 *
 * @example
 * filterByField([{ name: 'foo.txt' }, { name: 'bar.md' }], 'name', '*.txt')
 * // [{ name: 'foo.txt' }]
 */
export function filterByField<T extends Record<string, unknown>>(
  items: T[],
  field: keyof T,
  pattern: string,
  options: { caseSensitive?: boolean } = {}
): T[] {
  const regex = wildcardToRegex(pattern, options);
  return items.filter((item) => {
    const value = item[field];
    return typeof value === 'string' && regex.test(value);
  });
}

/**
 * Creates a fuzzy search function for filtering items.
 * Matches if all characters in the query appear in order in the text.
 *
 * @param query - The search query
 * @param options - Search options
 * @returns Function that tests if a string matches the fuzzy query
 *
 * @example
 * const matches = createFuzzyMatcher('fle');
 * matches('file') // true
 * matches('folder') // false
 */
export function createFuzzyMatcher(
  query: string,
  options: { caseSensitive?: boolean } = {}
): (text: string) => boolean {
  const { caseSensitive = false } = options;
  const normalizedQuery = caseSensitive ? query : query.toLowerCase();

  return (text: string) => {
    const normalizedText = caseSensitive ? text : text.toLowerCase();
    let queryIndex = 0;

    for (let i = 0; i < normalizedText.length && queryIndex < normalizedQuery.length; i++) {
      if (normalizedText[i] === normalizedQuery[queryIndex]) {
        queryIndex++;
      }
    }

    return queryIndex === normalizedQuery.length;
  };
}

/**
 * Performs a fuzzy search on an array of strings.
 *
 * @param items - Array of items to search
 * @param query - The search query
 * @param options - Search options
 * @returns Matching items sorted by relevance
 */
export function fuzzySearch(
  items: string[],
  query: string,
  options: { caseSensitive?: boolean } = {}
): string[] {
  if (!query) return [...items];

  const matcher = createFuzzyMatcher(query, options);
  return items.filter(matcher);
}

/**
 * Highlights matching portions of text based on a query.
 *
 * @param text - The text to highlight
 * @param query - The search query
 * @returns Array of segments with match indicators
 *
 * @example
 * highlightMatches('Hello World', 'wor')
 * // [{ text: 'Hello ', match: false }, { text: 'Wor', match: true }, { text: 'ld', match: false }]
 */
export function highlightMatches(
  text: string,
  query: string
): Array<{ text: string; match: boolean }> {
  if (!query) return [{ text, match: false }];

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const result: Array<{ text: string; match: boolean }> = [];

  let lastIndex = 0;
  let queryIndex = 0;
  let matchStart = -1;

  for (let i = 0; i < text.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      if (matchStart === -1) {
        // Add non-matching segment before this match
        if (i > lastIndex) {
          result.push({ text: text.slice(lastIndex, i), match: false });
        }
        matchStart = i;
      }
      queryIndex++;
    } else if (matchStart !== -1) {
      // End current match segment
      result.push({ text: text.slice(matchStart, i), match: true });
      lastIndex = i;
      matchStart = -1;
    }
  }

  // Handle remaining segments
  if (matchStart !== -1) {
    result.push({ text: text.slice(matchStart), match: true });
  } else if (lastIndex < text.length) {
    result.push({ text: text.slice(lastIndex), match: false });
  }

  // If we didn't match the entire query, return original text as non-match
  if (queryIndex < lowerQuery.length) {
    return [{ text, match: false }];
  }

  return result;
}
