# Asset Management

This directory contains static assets organized by type for consistent usage across the UI.

## Directory Structure

```
public/
├── assets/
│   ├── images/     # General images and graphics
│   ├── logos/      # Brand logos and icons
│   ├── maps/       # Map tiles and geographic assets
│   └── sounds/     # Audio files for notifications
└── templates/      # HTML templates for exports and previews
```

## Naming Conventions

- Use kebab-case for all asset filenames: `user-avatar.png`
- Include dimensions for size variants: `logo-120x40.svg`
- Use descriptive prefixes for placeholder assets: `placeholder-avatar.svg`
- Keep file extensions lowercase: `.svg`, `.png`, `.jpg`

## Using Assets in Code

Import the asset helpers from `@/constants`:

```typescript
import {
  getImagePath,
  getLogoPath,
  PLACEHOLDER_ASSETS,
} from '@/constants';

// Build paths to assets
const avatarPath = getImagePath('user-profile.png');
const logoPath = getLogoPath('company-logo.svg');

// Use placeholders for fallbacks
const fallbackAvatar = PLACEHOLDER_ASSETS.avatar;
```

## Available Helpers

| Function | Description |
|----------|-------------|
| `getImagePath(filename)` | Returns path to image asset |
| `getLogoPath(filename)` | Returns path to logo asset |
| `getMapPath(filename)` | Returns path to map asset |
| `getSoundPath(filename)` | Returns path to sound asset |
| `getTemplatePath(filename)` | Returns path to template file |

## Template Usage

Templates are used for document exports and report previews. They use mustache-style placeholders:

- `{{title}}` - Document title
- `{{date}}` - Generation date
- `{{content}}` - Main content HTML
- `{{year}}` - Current year

## Best Practices

1. **Optimize assets** - Compress images and use appropriate formats (SVG for icons, WebP for photos)
2. **Use placeholders** - Always provide fallback images for missing data
3. **Keep assets small** - Avoid large files in the repository; consider CDN for production
4. **Document new assets** - Update this README when adding new asset categories
