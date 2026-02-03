import { getToken, onMessage, type MessagePayload, type Unsubscribe } from 'firebase/messaging';
import { getFirebaseMessaging } from './FirebaseService';
import { apiClient } from '../axios';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, string>;
}

export type NotificationHandler = (payload: NotificationPayload) => void;

// Store for registered notification handlers
const notificationHandlers: Set<NotificationHandler> = new Set();

// Track token refresh callback cleanup
let tokenRefreshUnsubscribe: (() => void) | null = null;

// Track last known token to avoid redundant refresh calls
let lastKnownToken: string | null = null;

// Track onMessage listener cleanup
let onMessageUnsubscribe: Unsubscribe | null = null;

/**
 * NotificationService handles push notification permissions, token management,
 * and message handling for the frontend application.
 */
export const NotificationService = {
  /**
   * Requests notification permission from the user.
   * @returns The permission status after the request.
   */
  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission as NotificationPermissionStatus;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  },

  /**
   * Gets the current notification permission status.
   * @returns The current permission status.
   */
  getPermissionStatus(): NotificationPermissionStatus {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as NotificationPermissionStatus;
  },

  /**
   * Checks if notifications are currently permitted.
   */
  isPermissionGranted(): boolean {
    return this.getPermissionStatus() === 'granted';
  },

  /**
   * Checks if notification permission was denied.
   */
  isPermissionDenied(): boolean {
    return this.getPermissionStatus() === 'denied';
  },

  /**
   * Gets the FCM token for the current device.
   * Requires notification permission to be granted.
   * @param vapidKey The VAPID key for web push (from Firebase Console).
   * @returns The FCM token, or null if unavailable.
   */
  async getToken(vapidKey?: string): Promise<string | null> {
    const messaging = getFirebaseMessaging();
    if (!messaging) {
      console.warn('Firebase Messaging is not available.');
      return null;
    }

    if (!this.isPermissionGranted()) {
      console.warn('Notification permission is not granted.');
      return null;
    }

    const key = vapidKey ?? import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!key) {
      console.warn('VAPID key is not configured.');
      return null;
    }

    try {
      const token = await getToken(messaging, { vapidKey: key });
      return token;
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  },

  /**
   * Registers a device token with the backend server.
   * Should be called after obtaining a token to enable push notifications.
   * @param token The FCM token.
   * @param apiEndpoint The API endpoint to register the token.
   */
  async registerToken(token: string, apiEndpoint: string = '/api/v1/notifications/token'): Promise<boolean> {
    try {
      await apiClient.post(apiEndpoint, { token, platform: 'web' });
      return true;
    } catch (error) {
      console.error('Failed to register FCM token:', error);
      return false;
    }
  },

  /**
   * Sets up token refresh handling.
   * FCM tokens can expire or be rotated; this ensures the backend stays updated.
   * @param onTokenRefresh Callback invoked with the new token.
   */
  setupTokenRefresh(onTokenRefresh: (token: string) => void): void {
    // Clean up previous subscription if any
    if (tokenRefreshUnsubscribe) {
      tokenRefreshUnsubscribe();
      tokenRefreshUnsubscribe = null;
    }

    // Note: Firebase v9+ handles token refresh automatically.
    // We set up a periodic check as a fallback, only calling callback if token changed.
    const checkInterval = setInterval(async () => {
      if (!this.isPermissionGranted()) {
        return;
      }

      const token = await this.getToken();
      if (token && token !== lastKnownToken) {
        lastKnownToken = token;
        onTokenRefresh(token);
      }
    }, 60 * 60 * 1000); // Check every hour

    tokenRefreshUnsubscribe = () => {
      clearInterval(checkInterval);
    };
  },

  /**
   * Registers a handler for foreground notifications.
   * @param handler Callback invoked when a notification is received.
   * @returns Unsubscribe function to remove the handler.
   */
  onForegroundMessage(handler: NotificationHandler): () => void {
    const messaging = getFirebaseMessaging();
    if (!messaging) {
      console.warn('Firebase Messaging is not available.');
      return () => {};
    }

    notificationHandlers.add(handler);

    // Set up the Firebase onMessage listener if this is the first handler
    if (notificationHandlers.size === 1 && !onMessageUnsubscribe) {
      onMessageUnsubscribe = onMessage(messaging, (payload: MessagePayload) => {
        const notification = this.parsePayload(payload);
        if (notification) {
          notificationHandlers.forEach((h) => h(notification));
        }
      });
    }

    // Return unsubscribe function
    return () => {
      notificationHandlers.delete(handler);
      // Clean up onMessage listener when all handlers are removed
      if (notificationHandlers.size === 0 && onMessageUnsubscribe) {
        onMessageUnsubscribe();
        onMessageUnsubscribe = null;
      }
    };
  },

  /**
   * Parses a Firebase MessagePayload into a NotificationPayload.
   * @param payload The raw Firebase message payload.
   * @returns Parsed notification payload, or null if invalid.
   */
  parsePayload(payload: MessagePayload): NotificationPayload | null {
    const notification = payload.notification;

    if (!notification?.title) {
      // Try to extract from data payload
      const data = payload.data;
      if (data?.title) {
        return {
          title: data.title,
          body: data.body ?? '',
          ...(data.icon ? { icon: data.icon } : {}),
          data,
        };
      }
      return null;
    }

    return {
      title: notification.title,
      body: notification.body ?? '',
      ...(notification.icon ? { icon: notification.icon } : {}),
      ...(payload.data ? { data: payload.data } : {}),
    };
  },

  /**
   * Handles permission denied error gracefully.
   * @returns User-friendly error message.
   */
  getPermissionDeniedMessage(): string {
    return 'Notification permission was denied. To enable notifications, please update your browser settings and allow notifications for this site.';
  },

  /**
   * Cleans up notification service resources.
   * Should be called when the app is unmounting.
   */
  cleanup(): void {
    notificationHandlers.clear();
    if (tokenRefreshUnsubscribe) {
      tokenRefreshUnsubscribe();
      tokenRefreshUnsubscribe = null;
    }
    if (onMessageUnsubscribe) {
      onMessageUnsubscribe();
      onMessageUnsubscribe = null;
    }
    lastKnownToken = null;
  },
};
