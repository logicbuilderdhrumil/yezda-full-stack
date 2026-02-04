/**
 * App Auth Session Models
 * Task 1.1: Define app-specific auth and session models for mobile flows
 */

import type { TokenPair } from './auth.model.js';

/** App session metadata for device tracking */
export interface AppSessionMetadata {
  deviceId: string;
  deviceName?: string;
  platform: 'ios' | 'android';
  appVersion: string;
  osVersion?: string;
  model?: string;
  carrier?: string;
  locale?: string;
}

/** Extended app session entity with device tracking */
export interface AppSession {
  id: string;
  userId: string;
  userType: 'candidate';
  refreshTokenHash: string;
  deviceId: string;
  deviceName?: string;
  platform: 'ios' | 'android';
  appVersion: string;
  osVersion?: string;
  model?: string;
  ipAddress?: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
  rotatedFromId?: string;
  lastActiveAt: Date;
}

/** App sign-in request */
export interface AppSignInRequest {
  email: string;
  password: string;
  deviceId: string;
  deviceName?: string;
  platform: 'ios' | 'android';
  appVersion: string;
  osVersion?: string;
  model?: string;
  mfaCode?: string;
}

/** App sign-in response */
export interface AppSignInResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  sessionId: string;
}

/** App refresh token request */
export interface AppRefreshRequest {
  refreshToken: string;
  deviceId: string;
  appVersion: string;
}

/** App session info for listing active sessions */
export interface AppSessionInfo {
  sessionId: string;
  deviceId: string;
  deviceName?: string;
  platform: 'ios' | 'android';
  appVersion: string;
  osVersion?: string;
  model?: string;
  ipAddress?: string;
  createdAt: Date;
  lastActiveAt: Date;
  isCurrent: boolean;
}

/** App auth result */
export interface AppAuthResult {
  success: boolean;
  tokenPair?: TokenPair;
  userId?: string;
  sessionId?: string;
  requiresMfa?: boolean;
  mfaSessionToken?: string;
  error?: string;
  errorCode?: string;
}
