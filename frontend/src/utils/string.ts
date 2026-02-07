/**
 * String utility helpers.
 */

/**
 * Extracts an acronym from a string.
 * Takes the first letter of each word.
 *
 * @param text - The text to create an acronym from
 * @param maxLength - Maximum length of the acronym (default: 3)
 * @returns Uppercase acronym
 *
 * @example
 * acronym('World Health Organization') // 'WHO'
 * acronym('United States of America', 4) // 'USOA'
 */
export function acronym(text: string, maxLength = 3): string {
  if (!text.trim()) return '';

  const words = text.trim().split(/\s+/);
  const letters = words
    .map((word) => word[0]?.toUpperCase() ?? '')
    .filter(Boolean);

  return letters.slice(0, maxLength).join('');
}

/**
 * Extracts initials from a name.
 * Handles single names, full names, and hyphenated names.
 *
 * @param name - The name to extract initials from
 * @returns Uppercase initials (1-2 characters)
 *
 * @example
 * initials('John Doe') // 'JD'
 * initials('John') // 'J'
 * initials('Mary-Jane Watson') // 'MW'
 */
export function initials(name: string): string {
  if (!name.trim()) return '';

  const parts = name.trim().split(/\s+/);

  if (parts.length === 1) {
    const firstPart = parts[0];
    return firstPart && firstPart[0] ? firstPart[0].toUpperCase() : '';
  }

  const firstPart = parts[0];
  const lastPart = parts[parts.length - 1];
  const first = firstPart && firstPart[0] ? firstPart[0].toUpperCase() : '';
  const last = lastPart && lastPart[0] ? lastPart[0].toUpperCase() : '';

  return first + last;
}

/**
 * Truncates a string to a maximum length with an ellipsis.
 *
 * @param text - The text to truncate
 * @param maxLength - Maximum length including ellipsis
 * @param suffix - Suffix to append when truncated (default: '...')
 * @returns Truncated string
 *
 * @example
 * truncate('Hello World', 8) // 'Hello...'
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  if (maxLength <= suffix.length) return suffix.slice(0, maxLength);

  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalizes the first letter of a string.
 *
 * @param text - The text to capitalize
 * @returns String with first letter capitalized
 *
 * @example
 * capitalize('hello world') // 'Hello world'
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Converts a string to title case.
 *
 * @param text - The text to convert
 * @returns Title cased string
 *
 * @example
 * titleCase('hello world') // 'Hello World'
 */
export function titleCase(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => capitalize(word))
    .join(' ');
}

/**
 * Converts a string to kebab-case.
 *
 * @param text - The text to convert
 * @returns Kebab-cased string
 *
 * @example
 * kebabCase('Hello World') // 'hello-world'
 * kebabCase('camelCase') // 'camel-case'
 */
export function kebabCase(text: string): string {
  if (!text) return '';
  return text
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Converts a string to camelCase.
 *
 * @param text - The text to convert
 * @returns Camel-cased string
 *
 * @example
 * camelCase('hello-world') // 'helloWorld'
 * camelCase('Hello World') // 'helloWorld'
 */
export function camelCase(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''));
}

/**
 * Pluralizes a word based on count.
 *
 * @param count - The count to check
 * @param singular - Singular form
 * @param plural - Plural form (defaults to singular + 's')
 * @returns Appropriate form based on count
 *
 * @example
 * pluralize(1, 'item') // 'item'
 * pluralize(5, 'item') // 'items'
 * pluralize(2, 'person', 'people') // 'people'
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) return singular;
  return plural ?? singular + 's';
}

/**
 * Strips HTML tags from a string.
 *
 * @param html - The HTML string to strip
 * @returns Plain text without HTML tags
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Checks if a string is empty or contains only whitespace.
 *
 * @param text - The text to check
 * @returns True if the string is blank
 */
export function isBlank(text: string | undefined | null): boolean {
  return text == null || text.trim() === '';
}

/**
 * Checks if a string is not empty and contains non-whitespace characters.
 *
 * @param text - The text to check
 * @returns True if the string is not blank
 */
export function isNotBlank(text: string | undefined | null): text is string {
  return !isBlank(text);
}
