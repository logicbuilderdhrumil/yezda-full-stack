import { describe, it, expect } from 'vitest';
import {
  ASSETS_BASE_PATH,
  ASSET_PATHS,
  TEMPLATE_PATHS,
  PLACEHOLDER_ASSETS,
  getImagePath,
  getLogoPath,
  getMapPath,
  getSoundPath,
  getTemplatePath,
} from '@/constants/assets.constant';

describe('assets.constant', () => {
  describe('ASSETS_BASE_PATH', () => {
    it('should be defined', () => {
      expect(ASSETS_BASE_PATH).toBe('/assets');
    });
  });

  describe('ASSET_PATHS', () => {
    it('should define all asset categories', () => {
      expect(ASSET_PATHS.images).toBe('/assets/images');
      expect(ASSET_PATHS.logos).toBe('/assets/logos');
      expect(ASSET_PATHS.maps).toBe('/assets/maps');
      expect(ASSET_PATHS.sounds).toBe('/assets/sounds');
    });
  });

  describe('TEMPLATE_PATHS', () => {
    it('should define template paths', () => {
      expect(TEMPLATE_PATHS.base).toBe('/templates');
      expect(TEMPLATE_PATHS.documentExport).toBe('/templates/document-export.html');
      expect(TEMPLATE_PATHS.reportPreview).toBe('/templates/report-preview.html');
    });
  });

  describe('PLACEHOLDER_ASSETS', () => {
    it('should define placeholder paths', () => {
      expect(PLACEHOLDER_ASSETS.avatar).toBe('/assets/images/placeholder-avatar.svg');
      expect(PLACEHOLDER_ASSETS.image).toBe('/assets/images/placeholder-image.svg');
      expect(PLACEHOLDER_ASSETS.logo).toBe('/assets/logos/placeholder-logo.svg');
    });
  });

  describe('getImagePath', () => {
    it('should build correct image path', () => {
      expect(getImagePath('user-profile.png')).toBe('/assets/images/user-profile.png');
    });

    it('should handle nested paths', () => {
      expect(getImagePath('avatars/default.svg')).toBe('/assets/images/avatars/default.svg');
    });
  });

  describe('getLogoPath', () => {
    it('should build correct logo path', () => {
      expect(getLogoPath('company-logo.svg')).toBe('/assets/logos/company-logo.svg');
    });
  });

  describe('getMapPath', () => {
    it('should build correct map path', () => {
      expect(getMapPath('world-map.svg')).toBe('/assets/maps/world-map.svg');
    });
  });

  describe('getSoundPath', () => {
    it('should build correct sound path', () => {
      expect(getSoundPath('notification.mp3')).toBe('/assets/sounds/notification.mp3');
    });
  });

  describe('getTemplatePath', () => {
    it('should build correct template path', () => {
      expect(getTemplatePath('invoice.html')).toBe('/templates/invoice.html');
    });
  });
});
