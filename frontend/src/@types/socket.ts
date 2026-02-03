/**
 * Socket Types
 * Task 1.1: Define socket event types and payload interfaces
 */

// ============================================================================
// Namespace Definitions
// ============================================================================

/**
 * Available socket namespaces - mirrors backend definitions
 */
export const SOCKET_NAMESPACES = {
  /** Root namespace for general system events */
  ROOT: '/',
  /** Presence and user status updates */
  PRESENCE: '/presence',
  /** Notifications namespace */
  NOTIFICATIONS: '/notifications',
} as const;

export type SocketNamespace = (typeof SOCKET_NAMESPACES)[keyof typeof SOCKET_NAMESPACES];

// ============================================================================
// Event Definitions
// ============================================================================

/**
 * Server-to-client events - mirrors backend definitions
 */
export const SERVER_EVENTS = {
  // Presence events
  PRESENCE_UPDATE: 'presence:update',
  USER_ONLINE: 'presence:user_online',
  USER_OFFLINE: 'presence:user_offline',

  // Connection events
  CONNECTION_ACK: 'connection:ack',
  CONNECTION_ERROR: 'connection:error',

  // Notification events
  NOTIFICATION: 'notification:new',

  // Rate limit events
  RATE_LIMITED: 'rate:limited',
} as const;

/**
 * Client-to-server events - mirrors backend definitions
 */
export const CLIENT_EVENTS = {
  // Presence events
  SET_STATUS: 'presence:set_status',
  GET_STATUS: 'presence:get_status',
  SUBSCRIBE_PRESENCE: 'presence:subscribe',
  UNSUBSCRIBE_PRESENCE: 'presence:unsubscribe',

  // Ping for keepalive
  PING: 'ping',
} as const;

export type ServerEvent = (typeof SERVER_EVENTS)[keyof typeof SERVER_EVENTS];
export type ClientEvent = (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS];

// ============================================================================
// Connection State
// ============================================================================

/**
 * Socket connection status
 */
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

/**
 * Connection acknowledgment payload from server
 */
export interface ConnectionAckPayload {
  socketId: string;
  userId: string;
  timestamp: string;
}

/**
 * Connection error payload from server
 */
export interface ConnectionErrorPayload {
  reason: string;
  message?: string;
}

// ============================================================================
// Presence Types
// ============================================================================

/**
 * User presence status - mirrors backend definition
 */
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

/**
 * Presence update event payload - received from server
 */
export interface PresenceUpdatePayload {
  userId: string;
  userType: 'user' | 'candidate';
  status: PresenceStatus;
  tenantId?: string;
  timestamp: string | Date;
}

/**
 * Response from get status request
 */
export interface GetStatusResponse {
  statuses: Record<string, PresenceStatus>;
  error?: string;
}

/**
 * Response from set status request
 */
export interface SetStatusResponse {
  success?: boolean;
  status?: PresenceStatus;
  error?: string;
}

/**
 * Response from presence subscribe request
 */
export interface SubscribePresenceResponse {
  success?: boolean;
  error?: string;
}

// ============================================================================
// Rate Limit Types
// ============================================================================

/**
 * Rate limited event payload
 */
export interface RateLimitedPayload {
  event: string;
}

// ============================================================================
// Notification Types
// ============================================================================

/**
 * Notification payload from server
 */
export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  data?: Record<string, unknown>;
}

// ============================================================================
// Socket Context Types
// ============================================================================

/**
 * Socket connection options
 */
export interface SocketConnectionOptions {
  /** Socket.IO server URL */
  url: string;
  /** Namespace to connect to */
  namespace?: SocketNamespace;
  /** Authentication token getter */
  getToken: () => string | null | Promise<string | null>;
  /** Auto-connect on mount */
  autoConnect?: boolean;
  /** Enable reconnection */
  reconnection?: boolean;
  /** Number of reconnection attempts */
  reconnectionAttempts?: number;
  /** Delay between reconnection attempts (ms) */
  reconnectionDelay?: number;
}

/**
 * Socket context value provided to consumers
 */
export interface SocketContextValue {
  /** Current connection status */
  status: ConnectionStatus;
  /** Whether connected to the server */
  isConnected: boolean;
  /** Current socket ID (when connected) */
  socketId: string | null;
  /** Last error message */
  error: string | null;
  /** Connect to the socket server */
  connect: () => void;
  /** Disconnect from the socket server */
  disconnect: () => void;
  /** Emit an event to the server */
  emit: <T = unknown>(event: ClientEvent | string, data?: unknown) => Promise<T>;
  /** Subscribe to server events */
  on: (event: ServerEvent | string, handler: (data: unknown) => void) => () => void;
  /** Unsubscribe from server events */
  off: (event: ServerEvent | string, handler: (data: unknown) => void) => void;
}

// ============================================================================
// Presence Hook Types
// ============================================================================

/**
 * Presence hook return value
 */
export interface UsePresenceValue {
  /** Current user's presence status */
  myStatus: PresenceStatus;
  /** Set current user's status */
  setStatus: (status: Exclude<PresenceStatus, 'offline'>) => Promise<boolean>;
  /** Get status for specific users */
  getStatus: (userIds: string[]) => Promise<Record<string, PresenceStatus>>;
  /** Subscribe to presence updates for tenant */
  subscribe: (tenantId?: string) => Promise<boolean>;
  /** Unsubscribe from presence updates */
  unsubscribe: (tenantId?: string) => void;
  /** Map of user IDs to their presence status */
  presenceMap: Map<string, PresenceStatus>;
  /** Whether presence is loading */
  isLoading: boolean;
}
