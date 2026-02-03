import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getMessaging, type Messaging } from 'firebase/messaging';
import { getFirebaseConfig, isFirebaseConfigValid } from '@/configs/firebase.config';

let firebaseApp: FirebaseApp | null = null;
let messagingInstance: Messaging | null = null;

/**
 * Initializes the Firebase app with configuration from environment variables.
 * Safe to call multiple times; will return existing instance if already initialized.
 * @returns The Firebase app instance, or null if configuration is invalid.
 */
export function initializeFirebase(): FirebaseApp | null {
  if (firebaseApp) {
    return firebaseApp;
  }

  // Check if already initialized by another part of the app
  if (getApps().length > 0) {
    firebaseApp = getApp();
    return firebaseApp;
  }

  const config = getFirebaseConfig();

  if (!isFirebaseConfigValid(config)) {
    console.warn(
      'Firebase configuration is incomplete. Set VITE_FIREBASE_* environment variables.'
    );
    return null;
  }

  try {
    firebaseApp = initializeApp(config);
    return firebaseApp;
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return null;
  }
}

/**
 * Returns the Firebase app instance.
 * @throws Error if Firebase has not been initialized.
 */
export function getFirebaseApp(): FirebaseApp {
  if (!firebaseApp) {
    const initialized = initializeFirebase();
    if (!initialized) {
      throw new Error('Firebase is not initialized. Call initializeFirebase() first.');
    }
    firebaseApp = initialized;
  }
  return firebaseApp;
}

/**
 * Returns the Firebase Messaging instance.
 * Creates the instance on first call.
 * @returns The Messaging instance, or null if not supported.
 */
export function getFirebaseMessaging(): Messaging | null {
  if (messagingInstance) {
    return messagingInstance;
  }

  // Check if messaging is supported in this browser
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Firebase Messaging is not supported in this environment.');
    return null;
  }

  try {
    const app = getFirebaseApp();
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (error) {
    console.error('Failed to get Firebase Messaging:', error);
    return null;
  }
}

/**
 * Returns true if Firebase has been successfully initialized.
 */
export function isFirebaseInitialized(): boolean {
  return firebaseApp !== null || getApps().length > 0;
}
