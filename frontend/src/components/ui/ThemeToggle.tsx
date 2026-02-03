/**
 * ThemeToggle component for theme selection UI.
 * Provides controls for switching between light, dark, and system themes.
 */

import { useThemeStore, selectThemeMode, selectResolvedTheme, type ThemeStore } from '@/store';
import type { ThemeMode } from '@/@types/stores';

/** Theme mode options with labels and icons. */
const themeModeOptions: Array<{ mode: ThemeMode; label: string; icon: string }> = [
  { mode: 'light', label: 'Light', icon: '☀️' },
  { mode: 'dark', label: 'Dark', icon: '🌙' },
  { mode: 'system', label: 'System', icon: '💻' },
];

/**
 * ThemeToggle provides a dropdown or button group for theme selection.
 */
export function ThemeToggle() {
  const mode = useThemeStore(selectThemeMode);
  const resolvedTheme = useThemeStore(selectResolvedTheme);
  const setMode = useThemeStore((state: ThemeStore) => state.setMode);

  return (
    <div className="flex items-center gap-2">
      <div className="flex rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] p-1">
        {themeModeOptions.map((option) => (
          <button
            key={option.mode}
            type="button"
            onClick={() => setMode(option.mode)}
            className={`
              flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors
              ${
                mode === option.mode
                  ? 'bg-[var(--color-background)] text-[var(--color-foreground)] shadow-sm'
                  : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
              }
            `}
            aria-pressed={mode === option.mode}
            aria-label={`Set theme to ${option.label}`}
          >
            <span aria-hidden="true">{option.icon}</span>
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        ))}
      </div>
      <span className="text-xs text-[var(--color-muted-foreground)]">
        ({resolvedTheme})
      </span>
    </div>
  );
}

/**
 * Simple toggle button for quick light/dark switching.
 */
export function ThemeToggleButton() {
  const resolvedTheme = useThemeStore(selectResolvedTheme);
  const toggle = useThemeStore((state: ThemeStore) => state.toggle);

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-md p-2 text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
    >
      {resolvedTheme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
