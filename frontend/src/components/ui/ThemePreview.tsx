/**
 * Theme preview and reset controls.
 * Allows users to preview themes without persisting and reset to defaults.
 */

import { useState, useCallback } from 'react';
import { useThemeStore, selectThemeMode, selectResolvedTheme, type ThemeStore } from '@/store';
import { previewTheme } from '@/utils/themeGenerator';
import { themePresets } from '@/constants/theme.constant';

/**
 * ThemePreview component with hover-to-preview and reset functionality.
 */
export function ThemePreview() {
  const mode = useThemeStore(selectThemeMode);
  const resolvedTheme = useThemeStore(selectResolvedTheme);
  const setMode = useThemeStore((state: ThemeStore) => state.setMode);
  const reset = useThemeStore((state: ThemeStore) => state.reset);
  const [previewCleanup, setPreviewCleanup] = useState<(() => void) | null>(null);

  const handlePreviewStart = useCallback((themeName: 'light' | 'dark') => {
    // Only preview if it's different from current
    if (themeName !== resolvedTheme) {
      const cleanup = previewTheme(themeName);
      setPreviewCleanup(() => cleanup);
    }
  }, [resolvedTheme]);

  const handlePreviewEnd = useCallback(() => {
    if (previewCleanup) {
      previewCleanup();
      setPreviewCleanup(null);
    }
  }, [previewCleanup]);

  const handleSelect = useCallback((themeName: 'light' | 'dark') => {
    setPreviewCleanup(null);
    setMode(themeName);
  }, [setMode]);

  const handleReset = useCallback(() => {
    setPreviewCleanup(null);
    reset();
  }, [reset]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-[var(--color-foreground)]">
          Theme Selection
        </h3>
        <button
          type="button"
          onClick={handleReset}
          className="text-sm text-[var(--color-muted-foreground)] underline hover:text-[var(--color-foreground)]"
        >
          Reset to default
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {(Object.keys(themePresets) as Array<'light' | 'dark'>).map((themeName) => {
          const preset = themePresets[themeName];
          const isActive = mode === themeName || (mode === 'system' && resolvedTheme === themeName);

          return (
            <button
              key={themeName}
              type="button"
              onClick={() => handleSelect(themeName)}
              onMouseEnter={() => handlePreviewStart(themeName)}
              onMouseLeave={handlePreviewEnd}
              className={`
                relative overflow-hidden rounded-lg border-2 p-4 transition-all
                ${
                  isActive
                    ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] ring-offset-2'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]'
                }
              `}
              style={{
                backgroundColor: preset.tokens.colors.background,
                color: preset.tokens.colors.foreground,
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg">{themeName === 'dark' ? '🌙' : '☀️'}</span>
                <span className="font-medium">{preset.displayName}</span>
              </div>

              {/* Color palette preview */}
              <div className="flex gap-1">
                <div
                  className="h-6 w-6 rounded"
                  style={{ backgroundColor: preset.tokens.colors.primary }}
                  role="img"
                  aria-label="Primary color"
                />
                <div
                  className="h-6 w-6 rounded"
                  style={{ backgroundColor: preset.tokens.colors.secondary }}
                  role="img"
                  aria-label="Secondary color"
                />
                <div
                  className="h-6 w-6 rounded"
                  style={{ backgroundColor: preset.tokens.colors.success }}
                  role="img"
                  aria-label="Success color"
                />
                <div
                  className="h-6 w-6 rounded"
                  style={{ backgroundColor: preset.tokens.colors.warning }}
                  role="img"
                  aria-label="Warning color"
                />
                <div
                  className="h-6 w-6 rounded"
                  style={{ backgroundColor: preset.tokens.colors.destructive }}
                  role="img"
                  aria-label="Destructive color"
                />
              </div>

              {isActive && (
                <div className="absolute right-2 top-2">
                  <span className="text-[var(--color-primary)]">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-[var(--color-muted-foreground)]">
        Hover over a theme to preview it. Click to apply.
        {mode === 'system' && ' Currently using system preference.'}
      </p>
    </div>
  );
}
