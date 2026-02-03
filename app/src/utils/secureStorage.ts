/**
 * Secure token storage with expiry tracking.
 * Task 1.4: Add secure token storage with expiry tracking.
 */

import * as SecureStore from 'expo-secure-store';
import { SessionTokens } from '../types/auth.types';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  EXPIRES_AT: 'auth_expires_at',
} as const;

/**
 * Stores session tokens securely.
 */
export async function storeTokens(tokens: SessionTokens): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
    SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
    SecureStore.setItemAsync(STORAGE_KEYS.EXPIRES_AT, tokens.expiresAt.toString()),
  ]);
}

/**
 * Retrieves stored session tokens.
 * Returns null if no tokens stored or if tokens are incomplete.
 */
export async function getStoredTokens(): Promise<SessionTokens | null> {
  try {
    const [accessToken, refreshToken, expiresAtStr] = await Promise.all([
      SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
      SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
      SecureStore.getItemAsync(STORAGE_KEYS.EXPIRES_AT),
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
    SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN),
    SecureStore.deleteItemAsync(STORAGE_KEYS.EXPIRES_AT),
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
