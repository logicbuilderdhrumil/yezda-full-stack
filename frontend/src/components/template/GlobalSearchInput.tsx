/**
 * Global search input component for header.
 * Provides quick search across the application.
 */

import { useState, useCallback, type ReactNode, type ChangeEvent, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/utils';

export interface GlobalSearchInputProps {
  /** Additional CSS classes. */
  className?: string;
  /** Placeholder text. */
  placeholder?: string;
  /** Callback when a search is submitted. */
  onSearch?: (query: string) => void;
  /** Whether the search is currently loading. */
  isLoading?: boolean;
  /** Whether to expand on focus (mobile-friendly). */
  expandOnFocus?: boolean;
}

/**
 * GlobalSearchInput provides a search input for quick navigation.
 */
export function GlobalSearchInput({
  className,
  placeholder,
  onSearch,
  isLoading = false,
  expandOnFocus = true,
}: GlobalSearchInputProps): ReactNode {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const defaultPlaceholder = placeholder ?? t('search.placeholder');

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch?.('');
  }, [onSearch]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && query.trim()) {
        e.preventDefault();
        if (onSearch) {
          onSearch(query.trim());
        } else {
          // Default behavior: navigate to search results page
          navigate(`/search?q=${encodeURIComponent(query.trim())}`);
        }
      }
      if (e.key === 'Escape') {
        setQuery('');
        (e.target as HTMLInputElement).blur();
      }
    },
    [query, onSearch, navigate]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return (
    <div
      className={cn(
        'relative flex items-center transition-all duration-200',
        expandOnFocus && isFocused ? 'w-64 sm:w-80' : 'w-40 sm:w-56',
        className
      )}
      data-testid="global-search"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : (
          <Search className="h-4 w-4 text-gray-400" />
        )}
      </div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={defaultPlaceholder}
        className={cn(
          'w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-8 text-sm',
          'placeholder:text-gray-400',
          'focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary',
          'dark:border-gray-700 dark:bg-gray-800 dark:placeholder:text-gray-500',
          'dark:focus:border-primary dark:focus:bg-gray-900'
        )}
        aria-label={defaultPlaceholder}
        data-testid="global-search-input"
      />
      {query && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label={t('common.clear')}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
