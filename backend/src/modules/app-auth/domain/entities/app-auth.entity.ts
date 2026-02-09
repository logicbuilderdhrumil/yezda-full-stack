/**
 * App Auth Domain Entities
 * Mobile app authentication domain types
 */

export interface AppSignInCredentials {
  email: string;
  password: string;
  deviceId: string;
  deviceName?: string;
  platform?: string;
  appVersion?: string;
  osVersion?: string;
  model?: string;
  mfaCode?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface AppSignInResult {
  success: boolean;
  requiresMfa?: boolean;
  mfaSessionToken?: string;
  tokenPair?: TokenPair;
  sessionId?: string;
  error?: string;
  errorCode?: string;
}

export interface AppRefreshRequest {
  refreshToken: string;
  deviceId?: string;
  appVersion?: string;
}

export interface AppSession {
  sessionId: string;
  deviceName?: string;
  platform?: string;
  lastActive?: Date;
  isCurrent?: boolean;
}

export interface SignOutResult {
  revokedCount: number;
}
