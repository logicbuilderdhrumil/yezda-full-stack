/**
 * Language selector dropdown for switching UI locale.
 */

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useLocaleStore, selectLocale, type LocaleStore } from '@/store/localeStore';
import { supportedLocales } from '@/locales';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './DropdownMenu';
import { cn } from '@/utils';
import type { LocaleCode } from '@/@types/stores';

interface LanguageSelectorProps {
  /** Additional CSS classes. */
  className?: string;
  /** Show label text (true) or just icon (false). */
  showLabel?: boolean;
}

/**
 * LanguageSelector displays a dropdown for switching the UI language.
 */
export function LanguageSelector({
  className,
  showLabel = false,
}: LanguageSelectorProps): ReactNode {
  const { t } = useTranslation();
  const currentLocale = useLocaleStore(selectLocale);
  const setLocale = useLocaleStore((state: LocaleStore) => state.setLocale);

  const handleLocaleChange = (locale: LocaleCode) => {
    setLocale(locale);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700',
            'dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
            className
          )}
          aria-label={t('common.language')}
        >
          <Globe className="h-5 w-5" />
          {showLabel && (
            <span className="text-sm">{t(`languages.${currentLocale}`)}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[120px]">
        {supportedLocales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => handleLocaleChange(locale as LocaleCode)}
            className={cn(
              'cursor-pointer',
              currentLocale === locale &&
                'bg-gray-100 dark:bg-gray-700 font-medium'
            )}
          >
            {t(`languages.${locale}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
