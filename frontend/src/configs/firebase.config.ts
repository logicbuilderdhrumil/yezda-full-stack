/**
 * Firebase configuration for the frontend application.
 * Environment variables are loaded via Vite's import.meta.env.
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

/**
 * Reads Firebase configuration from environment variables.
 * All required fields must be present for Firebase to initialize.
 */
export function getFirebaseConfig(): FirebaseConfig {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY ?? '';
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '';
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '';
  const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '';
  const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '';
  const appId = import.meta.env.VITE_FIREBASE_APP_ID ?? '';
  const measurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    ...(measurementId ? { measurementId } : {}),
  };
}

/**
 * Validates that all required Firebase configuration fields are present.
 * @returns true if configuration is valid, false otherwise.
 */
export function isFirebaseConfigValid(config: FirebaseConfig): boolean {
  return Boolean(
    config.apiKey &&
      config.authDomain &&
      config.projectId &&
      config.storageBucket &&
      config.messagingSenderId &&
      config.appId
  );
}
