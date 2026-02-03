/**
 * Firebase Models
 * Task 1.2: Device token registration models
 */

/**
 * Device token registration entry
 */
export interface DeviceToken {
  id: string;
  userId: string;
  userType: 'user' | 'candidate';
  tenantId: string;
  /** Hash of device token for lookup (one-way) */
  tokenHash: string;
  /** Encrypted device token for dispatch (reversible) */
  encryptedToken: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
  deviceName?: string;
  appVersion?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

/**
 * Device token registration request
 */
export interface DeviceTokenRegistration {
  token: string;
  platform: 'ios' | 'android' | 'web';
  deviceId?: string;
  deviceName?: string;
  appVersion?: string;
}

/**
 * Notification payload for Firebase messaging
 */
export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  priority?: 'high' | 'normal';
  ttl?: number; // Time to live in seconds
}

/**
 * Notification event trigger
 */
export interface NotificationEvent {
  type: string;
  recipientId: string;
  recipientType: 'user' | 'candidate';
  tenantId: string;
  payload: NotificationPayload;
  metadata?: Record<string, unknown>;
}
