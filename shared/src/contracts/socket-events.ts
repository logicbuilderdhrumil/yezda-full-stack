/**
 * Socket Event Contracts
 * Shared socket event names and payload schemas.
 *
 * @see openspec/changes/integration-frontend-backend-foundations/specs/frontend-backend-integration/spec.md
 */

/**
 * Available socket namespaces.
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

/**
 * Server-to-client event names.
 */
export const SERVER_EVENTS = {
  // Connection lifecycle
  CONNECTION_ACK: 'connection:ack',
  CONNECTION_ERROR: 'connection:error',

  // Presence events
  PRESENCE_UPDATE: 'presence:update',
  USER_ONLINE: 'presence:user_online',
  USER_OFFLINE: 'presence:user_offline',

  // Notification events
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',
  NOTIFICATION_DELETED: 'notification:deleted',

  // Rate limiting
  RATE_LIMITED: 'rate:limited',

  // Session events
  SESSION_EXPIRED: 'session:expired',
  SESSION_REVOKED: 'session:revoked',
} as const;

export type ServerEvent = (typeof SERVER_EVENTS)[keyof typeof SERVER_EVENTS];

/**
 * Client-to-server event names.
 */
export const CLIENT_EVENTS = {
  // Presence events
  SET_STATUS: 'presence:set_status',
  GET_STATUS: 'presence:get_status',
  SUBSCRIBE_PRESENCE: 'presence:subscribe',
  UNSUBSCRIBE_PRESENCE: 'presence:unsubscribe',

  // Notification events
  MARK_NOTIFICATION_READ: 'notification:mark_read',
  MARK_ALL_NOTIFICATIONS_READ: 'notification:mark_all_read',

  // Keepalive
  PING: 'ping',
} as const;

export type ClientEvent = (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS];

/**
 * Connection status types.
 */
export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'error';

/**
 * User presence status.
 */
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

/**
 * User type for socket authentication.
 */
export type SocketUserType = 'user' | 'candidate';

// ============================================================================
// Server Event Payloads
// ============================================================================

/**
 * Connection acknowledgment payload.
 */
export interface ConnectionAckPayload {
  socketId: string;
  userId: string;
  userType: SocketUserType;
  tenantId?: string;
  timestamp: string;
}

/**
 * Connection error payload.
 */
export interface ConnectionErrorPayload {
  reason: 'auth_failed' | 'token_expired' | 'invalid_token' | 'rate_limited' | 'server_error';
  message: string;
  retryable: boolean;
}

/**
 * Presence update payload.
 */
export interface PresenceUpdatePayload {
  userId: string;
  userType: SocketUserType;
  status: PresenceStatus;
  tenantId?: string;
  timestamp: string;
}

/**
 * Rate limited event payload.
 */
export interface RateLimitedPayload {
  event: string;
  retryAfter: number;
  message: string;
}

/**
 * Session expired event payload.
 */
export interface SessionExpiredPayload {
  reason: 'token_expired' | 'session_revoked' | 'password_changed';
  message: string;
}

// ============================================================================
// Client Event Payloads
// ============================================================================

/**
 * Set status request payload.
 */
export interface SetStatusPayload {
  status: Exclude<PresenceStatus, 'offline'>;
}

/**
 * Set status response.
 */
export interface SetStatusResponse {
  success: boolean;
  status?: PresenceStatus;
  error?: string;
}

/**
 * Get status request payload.
 */
export interface GetStatusPayload {
  userIds: string[];
}

/**
 * Get status response.
 */
export interface GetStatusResponse {
  statuses: Record<string, PresenceStatus>;
  error?: string;
}

/**
 * Subscribe to presence updates payload.
 */
export interface SubscribePresencePayload {
  tenantId?: string;
  userIds?: string[];
}

/**
 * Subscribe presence response.
 */
export interface SubscribePresenceResponse {
  success: boolean;
  error?: string;
}

/**
 * Ping response payload.
 */
export interface PingResponse {
  pong: boolean;
  timestamp: number;
  serverTime: string;
}
