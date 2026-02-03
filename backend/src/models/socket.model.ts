/**
 * Socket Infrastructure Models
 * Task 1.1: Define socket namespaces, events, and auth requirements
 */

import { z } from 'zod';

// ============================================================================
// Namespace Definitions
// ============================================================================

/**
 * Available socket namespaces
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
 * Server-to-client events
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
 * Client-to-server events
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
// Socket Auth Data
// ============================================================================

/**
 * Socket authentication data attached to socket
 */
export interface SocketAuthData {
  userId: string;
  userType: 'user' | 'candidate';
  tenantId?: string;
  roles?: string[];
  authenticatedAt: Date;
}

/**
 * Socket handshake auth payload (sent by client)
 */
export const socketAuthSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type SocketAuthPayload = z.infer<typeof socketAuthSchema>;

// ============================================================================
// Presence Models
// ============================================================================

/**
 * User presence status
 */
export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

/**
 * Presence information for a user
 */
export interface UserPresence {
  userId: string;
  userType: 'user' | 'candidate';
  status: PresenceStatus;
  tenantId?: string;
  lastSeen: Date;
  socketIds: string[];
}

/**
 * Presence update event payload
 */
export interface PresenceUpdatePayload {
  userId: string;
  userType: 'user' | 'candidate';
  status: PresenceStatus;
  tenantId?: string;
  timestamp: Date;
}

/**
 * Schema for set status request
 */
export const setStatusSchema = z.object({
  status: z.enum(['online', 'away', 'busy']),
});

export type SetStatusPayload = z.infer<typeof setStatusSchema>;

// ============================================================================
// Socket Rate Limiting
// ============================================================================

/**
 * Rate limit configuration for socket events
 */
export interface SocketRateLimitConfig {
  /** Maximum events per window */
  maxEvents: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

/**
 * Default rate limits by event category
 */
export const SOCKET_RATE_LIMITS: Record<string, SocketRateLimitConfig> = {
  /** Connection rate limit per IP */
  connection: { maxEvents: 10, windowMs: 60000 },
  /** Presence update rate limit per user */
  presence: { maxEvents: 30, windowMs: 60000 },
  /** General message rate limit per socket */
  message: { maxEvents: 100, windowMs: 60000 },
};

// ============================================================================
// Socket Metrics
// ============================================================================

/**
 * Socket-specific metric names
 */
export const SOCKET_METRICS = {
  CONNECTION_SUCCESS: 'socket_connection_success_total',
  CONNECTION_FAILURE: 'socket_connection_failure_total',
  CONNECTION_CLOSED: 'socket_connection_closed_total',
  MESSAGE_SENT: 'socket_message_sent_total',
  MESSAGE_RECEIVED: 'socket_message_received_total',
  RATE_LIMITED: 'socket_rate_limited_total',
  AUTH_FAILURE: 'socket_auth_failure_total',
  PRESENCE_UPDATE: 'socket_presence_update_total',
  ACTIVE_CONNECTIONS: 'socket_active_connections',
} as const;

/**
 * Socket service SLO targets
 */
export const SOCKET_SLOS = {
  /** Connection establishment P99 latency in ms */
  CONNECTION_LATENCY_P99_MS: 200,
  /** Connection success rate target */
  CONNECTION_SUCCESS_RATE: 99.9,
  /** Message delivery latency P99 in ms */
  MESSAGE_LATENCY_P99_MS: 100,
  /** Availability target percentage */
  AVAILABILITY_RATE: 99.95,
  /** Max auth failures per minute before alert */
  MAX_AUTH_FAILURES_PER_MINUTE: 50,
} as const;

// ============================================================================
// Audit Event Types for Sockets
// ============================================================================

/**
 * Socket-specific audit event types
 */
export type SocketAuditEventType =
  | 'SOCKET_CONNECTED'
  | 'SOCKET_DISCONNECTED'
  | 'SOCKET_AUTH_SUCCESS'
  | 'SOCKET_AUTH_FAILURE'
  | 'SOCKET_SUBSCRIPTION_GRANTED'
  | 'SOCKET_SUBSCRIPTION_DENIED'
  | 'SOCKET_RATE_LIMITED';

// ============================================================================
// Socket Room Definitions
// ============================================================================

/**
 * Room name generators for tenant isolation
 */
export function getTenantRoom(tenantId: string): string {
  return `tenant:${tenantId}`;
}

export function getUserRoom(userId: string): string {
  return `user:${userId}`;
}

export function getPresenceRoom(tenantId: string): string {
  return `presence:${tenantId}`;
}
