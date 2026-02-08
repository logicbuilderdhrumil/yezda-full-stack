/**
 * Secure token storage with expiry tracking.
 * Task 1.4: Add secure token storage with expiry tracking.
 *
 * Uses expo-secure-store on native (iOS/Android) and localStorage on web.
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SessionTokens } from '../types/auth.types';

/** Platform-aware storage adapter: SecureStore on native, localStorage on web. */
const storage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  EXPIRES_AT: 'auth_expires_at',
  DEVICE_ID: 'yezda_device_id',
} as const;

/**
 * Stores session tokens securely.
 */
export async function storeTokens(tokens: SessionTokens): Promise<void> {
  await Promise.all([
    storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
    storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
    storage.setItem(STORAGE_KEYS.EXPIRES_AT, tokens.expiresAt.toString()),
  ]);
}

/**
 * Retrieves stored session tokens.
 * Returns null if no tokens stored or if tokens are incomplete.
 */
export async function getStoredTokens(): Promise<SessionTokens | null> {
  try {
    const [accessToken, refreshToken, expiresAtStr] = await Promise.all([
      storage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
      storage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
      storage.getItem(STORAGE_KEYS.EXPIRES_AT),
    ]);

    if (!accessToken || !refreshToken || !expiresAtStr) {
      return null;
    }

    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt)) {
      return null;
    }

    return { accessToken, refreshToken, expiresAt };
  } catch (error) {
    console.error('Failed to retrieve stored tokens:', error);
    return null;
  }
}

/**
 * Clears all stored session tokens.
 */
export async function clearStoredTokens(): Promise<void> {
  await Promise.all([
    storage.deleteItem(STORAGE_KEYS.ACCESS_TOKEN),
    storage.deleteItem(STORAGE_KEYS.REFRESH_TOKEN),
    storage.deleteItem(STORAGE_KEYS.EXPIRES_AT),
  ]);
}

/**
 * Checks if the stored access token is expired.
 * Adds a buffer of 60 seconds to account for network latency.
 */
export function isTokenExpired(expiresAt: number, bufferMs: number = 60000): boolean {
  return Date.now() >= expiresAt - bufferMs;
}

/**
 * Checks if stored tokens exist and are still valid.
 */
export async function hasValidStoredSession(): Promise<boolean> {
  const tokens = await getStoredTokens();
  if (!tokens) {
    return false;
  }
  return !isTokenExpired(tokens.expiresAt);
}

/**
 * Returns a persistent device identifier, creating and storing one on first call.
 * Uses SecureStore on native and localStorage on web.
 */
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await storage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (existing) {
    return existing;
  }
  const id = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  await storage.setItem(STORAGE_KEYS.DEVICE_ID, id);
  return id;
}
