/**
 * Firebase Configuration
 * Task 1.1: Firebase Admin SDK configuration and initialization
 */

export interface FirebaseConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  databaseURL?: string;
  storageBucket?: string;
}

export interface FirebaseRateLimitConfig {
  windowMs: number;
  maxTokenRegistrations: number;
  maxNotificationDispatch: number;
}

function getEnvOrDefault(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function getEnvIntOrDefault(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Validate Firebase credentials at startup
 * Fails fast in production if credentials are missing
 */
function validateFirebaseCredentials(config: FirebaseConfig): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const missing: string[] = [];

  if (!config.projectId || config.projectId === 'dev-project-id') {
    missing.push('FIREBASE_PROJECT_ID');
  }

  if (!config.clientEmail || config.clientEmail === 'dev@example.com') {
    missing.push('FIREBASE_CLIENT_EMAIL');
  }

  if (!config.privateKey || config.privateKey === 'dev-private-key') {
    missing.push('FIREBASE_PRIVATE_KEY');
  }

  if (missing.length > 0) {
    const message = `Firebase credentials incomplete: ${missing.join(', ')}`;
    if (isProduction) {
      throw new Error(message);
    }
    console.warn(`[FIREBASE WARNING] ${message}`);
  }
}

// Parse private key - replace escaped newlines with actual newlines
function parsePrivateKey(key: string): string {
  return key.replace(/\\n/g, '\n');
}

export const firebaseConfig: FirebaseConfig = {
  projectId: getEnvOrDefault('FIREBASE_PROJECT_ID', 'dev-project-id'),
  clientEmail: getEnvOrDefault('FIREBASE_CLIENT_EMAIL', 'dev@example.com'),
  privateKey: parsePrivateKey(getEnvOrDefault('FIREBASE_PRIVATE_KEY', 'dev-private-key')),
  databaseURL: getEnvOrDefault('FIREBASE_DATABASE_URL', ''),
  storageBucket: getEnvOrDefault('FIREBASE_STORAGE_BUCKET', ''),
};

export const firebaseRateLimitConfig: FirebaseRateLimitConfig = {
  windowMs: getEnvIntOrDefault('FIREBASE_RATE_LIMIT_WINDOW_MS', 60000), // 1 minute
  maxTokenRegistrations: getEnvIntOrDefault('FIREBASE_MAX_TOKEN_REGISTRATIONS', 10), // 10 per minute
  maxNotificationDispatch: getEnvIntOrDefault('FIREBASE_MAX_NOTIFICATION_DISPATCH', 50), // 50 per minute
};

// Validate on module load (will warn in dev, fail in prod)
validateFirebaseCredentials(firebaseConfig);

export default firebaseConfig;
