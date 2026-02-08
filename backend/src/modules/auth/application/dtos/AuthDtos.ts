/**
 * Auth DTOs — Input/output data transfer objects for auth use cases
 */
import type { TokenPair } from '../../domain/value-objects/TokenPair.js';

export interface SignUpInput {
  email: string;
  password: string;
  userType: 'user' | 'candidate';
}

export interface SignInInput {
  email: string;
  password: string;
  userType: 'user' | 'candidate';
  mfaCode?: string;
  deviceInfo?: string;
  ipAddress?: string;
  userAgent?: string;
  channel: 'web' | 'mobile' | 'api';
}

export interface AuthResult {
  success: boolean;
  tokenPair?: TokenPair;
  requiresMfa?: boolean;
  mfaSessionToken?: string;
  error?: string;
  errorCode?: string;
}
