/**
 * Socket Constants
 * Task 1.2: Define socket connection options and namespaces
 */

import { SOCKET_NAMESPACES } from '@/@types/socket';

/**
 * Default socket server URL - uses environment variable or defaults to same origin
 * (proxied through Vite dev server via /socket.io proxy rule)
 */
export const SOCKET_SERVER_URL =
  import.meta.env.VITE_SOCKET_URL || '';

/**
 * Default connection options
 */
export const DEFAULT_SOCKET_OPTIONS = {
  /** Enable automatic reconnection */
  reconnection: true,
  /** Maximum number of reconnection attempts */
  reconnectionAttempts: 10,
  /** Initial delay between reconnection attempts (ms) */
  reconnectionDelay: 1000,
  /** Maximum delay between reconnection attempts (ms) */
  reconnectionDelayMax: 10000,
  /** Randomization factor for reconnection delay */
  randomizationFactor: 0.5,
  /** Connection timeout (ms) */
  timeout: 20000,
  /** Transports to use (prefer websocket) */
  transports: ['websocket', 'polling'] as const,
  /** Auto-connect on initialization */
  autoConnect: false,
} as const;

/**
 * Ping interval for keepalive (ms)
 */
export const PING_INTERVAL = 25000;

/**
 * Namespaces re-exported for convenience
 */
export { SOCKET_NAMESPACES };

/**
 * Connection status labels for UI display
 */
export const CONNECTION_STATUS_LABELS: Record<string, string> = {
  disconnected: 'Disconnected',
  connecting: 'Connecting...',
  connected: 'Connected',
  reconnecting: 'Reconnecting...',
  error: 'Connection Error',
};

/**
 * Presence status labels for UI display
 */
export const PRESENCE_STATUS_LABELS: Record<string, string> = {
  online: 'Online',
  away: 'Away',
  busy: 'Busy',
  offline: 'Offline',
};

/**
 * Presence status colors for UI display
 */
export const PRESENCE_STATUS_COLORS: Record<string, string> = {
  online: 'bg-green-500',
  away: 'bg-yellow-500',
  busy: 'bg-red-500',
  offline: 'bg-gray-400',
};
