export type PreferenceKey = 'theme' | 'locale' | 'presence';
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';
export type ThemeValue = 'light' | 'dark' | 'system';
export type LocaleValue = string;

export interface StateEntry {
  id: string;
  tenantId: string;
  userId: string;
  userType: 'user' | 'candidate';
  key: string;
  value: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme?: ThemeValue;
  locale?: LocaleValue;
  presence?: PresenceStatus;
}

export interface SessionState {
  lastActivity?: Date;
  currentView?: string;
  unsavedChanges?: boolean;
  customData?: Record<string, unknown>;
}

export interface UserState {
  preferences: UserPreferences;
  sessionState: SessionState;
}

export interface StateOperationResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  data?: unknown;
}
