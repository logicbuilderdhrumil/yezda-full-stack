/**
 * Asset path helpers for standardized asset references across the UI.
 * Assets are organized under public/assets by type.
 */

/** Base path for all static assets */
export const ASSETS_BASE_PATH = '/assets';

/** Asset folder paths by category */
export const ASSET_PATHS = {
  images: `${ASSETS_BASE_PATH}/images`,
  logos: `${ASSETS_BASE_PATH}/logos`,
  maps: `${ASSETS_BASE_PATH}/maps`,
  sounds: `${ASSETS_BASE_PATH}/sounds`,
} as const;

/** Template paths for document exports and previews */
export const TEMPLATE_PATHS = {
  base: '/templates',
  documentExport: '/templates/document-export.html',
  reportPreview: '/templates/report-preview.html',
} as const;

/** Placeholder asset paths for UI components */
export const PLACEHOLDER_ASSETS = {
  avatar: `${ASSET_PATHS.images}/placeholder-avatar.svg`,
  image: `${ASSET_PATHS.images}/placeholder-image.svg`,
  logo: `${ASSET_PATHS.logos}/placeholder-logo.svg`,
} as const;

/**
 * Build a path to an image asset.
 * @param filename - The image filename including extension
 */
export function getImagePath(filename: string): string {
  return `${ASSET_PATHS.images}/${filename}`;
}

/**
 * Build a path to a logo asset.
 * @param filename - The logo filename including extension
 */
export function getLogoPath(filename: string): string {
  return `${ASSET_PATHS.logos}/${filename}`;
}

/**
 * Build a path to a map asset.
 * @param filename - The map filename including extension
 */
export function getMapPath(filename: string): string {
  return `${ASSET_PATHS.maps}/${filename}`;
}

/**
 * Build a path to a sound asset.
 * @param filename - The sound filename including extension
 */
export function getSoundPath(filename: string): string {
  return `${ASSET_PATHS.sounds}/${filename}`;
}

/**
 * Build a path to a template asset.
 * @param filename - The template filename including extension
 */
export function getTemplatePath(filename: string): string {
  return `${TEMPLATE_PATHS.base}/${filename}`;
}

/** Asset types for categorization */
export type AssetType = keyof typeof ASSET_PATHS;
