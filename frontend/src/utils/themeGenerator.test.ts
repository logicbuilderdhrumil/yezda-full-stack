/**
 * Tests for theme generator utilities.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateCSSVariables,
  applyThemeToDocument,
  getThemePreset,
  generateCustomTheme,
  previewTheme,
} from './themeGenerator';
import { lightTheme, darkTheme } from '@/constants/theme.constant';

// Mock document
const mockDocumentElement = {
  style: {
    setProperty: vi.fn(),
    removeProperty: vi.fn(),
  },
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
  },
  setAttribute: vi.fn(),
  getAttribute: vi.fn(),
};

describe('generateCSSVariables', () => {
  it('should generate CSS variables string from theme tokens', () => {
    const cssVars = generateCSSVariables(lightTheme.tokens);

    expect(cssVars).toContain('--color-primary: #2563eb;');
    expect(cssVars).toContain('--color-background: #ffffff;');
    expect(cssVars).toContain('--font-family:');
    expect(cssVars).toContain('--spacing-md: 1rem;');
    expect(cssVars).toContain('--radius-md: 0.5rem;');
  });

  it('should generate different values for dark theme', () => {
    const cssVars = generateCSSVariables(darkTheme.tokens);

    expect(cssVars).toContain('--color-primary: #3b82f6;');
    expect(cssVars).toContain('--color-background: #0f172a;');
    expect(cssVars).toContain('--color-foreground: #f8fafc;');
  });
});

describe('applyThemeToDocument', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      documentElement: mockDocumentElement,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should set data-theme attribute', () => {
    applyThemeToDocument('light');
    expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
  });

  it('should add dark class for dark theme', () => {
    applyThemeToDocument('dark');
    expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
  });

  it('should remove dark class for light theme', () => {
    applyThemeToDocument('light');
    expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('dark');
  });

  it('should set CSS property for each color token', () => {
    applyThemeToDocument('light');

    expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
      '--color-primary',
      lightTheme.tokens.colors.primary
    );
    expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
      '--color-background',
      lightTheme.tokens.colors.background
    );
  });

  it('should set typography CSS properties', () => {
    applyThemeToDocument('light');

    expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
      '--font-family',
      expect.any(String)
    );
    expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
      '--font-size-base',
      '1rem'
    );
  });

  it('should set spacing CSS properties', () => {
    applyThemeToDocument('light');

    expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
      '--spacing-md',
      '1rem'
    );
    expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
      '--spacing-lg',
      '1.5rem'
    );
  });

  it('should set radius CSS properties', () => {
    applyThemeToDocument('light');

    expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
      '--radius-md',
      '0.5rem'
    );
    expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
      '--radius-full',
      '9999px'
    );
  });
});

describe('getThemePreset', () => {
  it('should return light theme preset', () => {
    const preset = getThemePreset('light');
    expect(preset.name).toBe('light');
    expect(preset.displayName).toBe('Light');
    expect(preset.tokens).toBeDefined();
  });

  it('should return dark theme preset', () => {
    const preset = getThemePreset('dark');
    expect(preset.name).toBe('dark');
    expect(preset.displayName).toBe('Dark');
    expect(preset.tokens).toBeDefined();
  });
});

describe('generateCustomTheme', () => {
  it('should merge custom colors with base theme', () => {
    const customTokens = generateCustomTheme('light', {
      colors: { primary: '#ff0000' },
    });

    expect(customTokens.colors.primary).toBe('#ff0000');
    // Other colors should remain from base theme
    expect(customTokens.colors.secondary).toBe(lightTheme.tokens.colors.secondary);
    expect(customTokens.colors.background).toBe(lightTheme.tokens.colors.background);
  });

  it('should merge custom typography with base theme', () => {
    const customTokens = generateCustomTheme('dark', {
      typography: { fontSizeBase: '1.125rem' },
    });

    expect(customTokens.typography.fontSizeBase).toBe('1.125rem');
    expect(customTokens.typography.fontFamily).toBe(darkTheme.tokens.typography.fontFamily);
  });

  it('should merge custom spacing with base theme', () => {
    const customTokens = generateCustomTheme('light', {
      spacing: { md: '1.25rem' },
    });

    expect(customTokens.spacing.md).toBe('1.25rem');
    expect(customTokens.spacing.lg).toBe(lightTheme.tokens.spacing.lg);
  });

  it('should merge custom radius with base theme', () => {
    const customTokens = generateCustomTheme('light', {
      radius: { md: '0.625rem' },
    });

    expect(customTokens.radius.md).toBe('0.625rem');
    expect(customTokens.radius.lg).toBe(lightTheme.tokens.radius.lg);
  });
});

describe('previewTheme', () => {
  beforeEach(() => {
    vi.stubGlobal('document', {
      documentElement: {
        ...mockDocumentElement,
        getAttribute: vi.fn().mockReturnValue('light'),
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should return a cleanup function', () => {
    const cleanup = previewTheme('dark');
    expect(typeof cleanup).toBe('function');
  });

  it('should apply the new theme', () => {
    previewTheme('dark');
    expect(mockDocumentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
  });
});
