/**
 * Theme configurator panel component.
 * Provides detailed theme customization options.
 */

import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useThemeStore, selectThemeMode, type ThemeStore } from '@/store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { cn } from '@/utils';
import type { ThemeMode } from '@/@types/stores';

export interface ThemeConfiguratorProps {
  /** Additional CSS classes. */
  className?: string;
  /** Show as icon-only button or with label. */
  showLabel?: boolean;
}

interface ThemeModeOption {
  mode: ThemeMode;
  labelKey: string;
  icon: typeof Sun;
}

const themeModeOptions: ThemeModeOption[] = [
  { mode: 'light', labelKey: 'theme.light', icon: Sun },
  { mode: 'dark', labelKey: 'theme.dark', icon: Moon },
  { mode: 'system', labelKey: 'theme.system', icon: Monitor },
];

/**
 * ThemeConfigurator provides a dropdown menu for theme selection.
 */
export function ThemeConfigurator({
  className,
  showLabel = false,
}: ThemeConfiguratorProps): ReactNode {
  const { t } = useTranslation();
  const currentMode = useThemeStore(selectThemeMode);
  const setMode = useThemeStore((state: ThemeStore) => state.setMode);

  const handleModeChange = (mode: ThemeMode) => {
    setMode(mode);
  };

  const currentOption = themeModeOptions.find((opt) => opt.mode === currentMode) ?? themeModeOptions[0];
  const CurrentIcon = currentOption?.icon ?? Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700',
            'dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200',
            className
          )}
          aria-label={t('theme.toggle')}
          data-testid="theme-configurator-trigger"
        >
          <CurrentIcon className="h-5 w-5" />
          {showLabel && (
            <span className="text-sm">{t(currentOption?.labelKey ?? 'theme.light')}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{t('theme.appearance')}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themeModeOptions.map(({ mode, labelKey, icon: Icon }) => (
          <DropdownMenuItem
            key={mode}
            onClick={() => handleModeChange(mode)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              <span>{t(labelKey)}</span>
            </div>
            {currentMode === mode && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
