/**
 * Date and time formatting helpers.
 */

/**
 * Format options for date formatting.
 */
export interface DateFormatOptions {
  /** Include time in the output */
  includeTime?: boolean;
  /** Use relative time (e.g., "2 hours ago") */
  relative?: boolean;
  /** Locale for formatting */
  locale?: string;
}

/**
 * Formats a date as a localized date string.
 * @param date - The date to format (Date, string, or timestamp)
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  options: DateFormatOptions = {}
): string {
  const { includeTime = false, relative = false, locale = 'en-US' } = options;
  const d = toDate(date);

  if (relative) {
    return formatRelativeTime(d, locale);
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  if (includeTime) {
    dateOptions.hour = '2-digit';
    dateOptions.minute = '2-digit';
  }

  return d.toLocaleDateString(locale, dateOptions);
}

/**
 * Formats a date as a time string.
 * @param date - The date to format
 * @param locale - Locale for formatting
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export function formatTime(date: Date | string | number, locale = 'en-US'): string {
  const d = toDate(date);
  return d.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a date as a relative time string.
 * @param date - The date to format
 * @param locale - Locale for formatting
 * @returns Relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string | number, locale = 'en-US'): string {
  const d = toDate(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffSeconds) < 60) {
    return rtf.format(-diffSeconds, 'second');
  }
  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(-diffMinutes, 'minute');
  }
  if (Math.abs(diffHours) < 24) {
    return rtf.format(-diffHours, 'hour');
  }
  if (Math.abs(diffDays) < 30) {
    return rtf.format(-diffDays, 'day');
  }

  // Fall back to absolute date for older dates
  return formatDate(d, { locale });
}

/**
 * Formats a date as ISO date string (YYYY-MM-DD).
 * @param date - The date to format
 * @returns ISO date string
 */
export function formatISODate(date: Date | string | number): string {
  const d = toDate(date);
  return d.toISOString().split('T')[0];
}

/**
 * Converts various date representations to a Date object.
 * @param value - The value to convert
 * @returns Date object
 */
export function toDate(value: Date | string | number): Date {
  if (value instanceof Date) {
    return value;
  }
  return new Date(value);
}

/**
 * Checks if a date is today.
 * @param date - The date to check
 * @returns True if the date is today
 */
export function isToday(date: Date | string | number): boolean {
  const d = toDate(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Checks if a date is in the past.
 * @param date - The date to check
 * @returns True if the date is before now
 */
export function isPast(date: Date | string | number): boolean {
  return toDate(date).getTime() < Date.now();
}

/**
 * Checks if a date is in the future.
 * @param date - The date to check
 * @returns True if the date is after now
 */
export function isFuture(date: Date | string | number): boolean {
  return toDate(date).getTime() > Date.now();
}

/**
 * Formats a number as a currency string.
 * @param amount - The amount to format
 * @param currency - The currency code (e.g., 'USD', 'EUR')
 * @param locale - Locale for formatting
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}
