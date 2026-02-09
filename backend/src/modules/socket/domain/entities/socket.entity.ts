/**
 * Socket Domain Entities — namespaces, events, auth, presence, rate limits, metrics
 * Migrated from legacy socket.model.ts
 */

import { z } from 'zod';

// --- Namespace Definitions ---

export const SOCKET_NAMESPACES = {
  ROOT: '/',
  PRESENCE: '/presence',
  NOTIFICATIONS: '/notifications',
} as const;

export type SocketNamespace = (typeof SOCKET_NAMESPACES)[keyof typeof SOCKET_NAMESPACES];

// --- Event Definitions ---

export const SERVER_EVENTS = {
  PRESENCE_UPDATE: 'presence:update',
  USER_ONLINE: 'presence:user_online',
  USER_OFFLINE: 'presence:user_offline',
  CONNECTION_ACK: 'connection:ack',
  CONNECTION_ERROR: 'connection:error',
  NOTIFICATION: 'notification:new',
  RATE_LIMITED: 'rate:limited',
} as const;

export const CLIENT_EVENTS = {
  SET_STATUS: 'presence:set_status',
  GET_STATUS: 'presence:get_status',
  SUBSCRIBE_PRESENCE: 'presence:subscribe',
  UNSUBSCRIBE_PRESENCE: 'presence:unsubscribe',
  PING: 'ping',
} as const;

export type ServerEvent = (typeof SERVER_EVENTS)[keyof typeof SERVER_EVENTS];
export type ClientEvent = (typeof CLIENT_EVENTS)[keyof typeof CLIENT_EVENTS];

// --- Auth ---

export interface SocketAuthData {
  userId: string;
  userType: 'user' | 'candidate';
  tenantId?: string;
  roles?: string[];
  authenticatedAt: Date;
}

export const socketAuthSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type SocketAuthPayload = z.infer<typeof socketAuthSchema>;

// --- Presence ---

export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

export interface UserPresence {
  userId: string;
  userType: 'user' | 'candidate';
  status: PresenceStatus;
  tenantId?: string;
  lastSeen: Date;
  socketIds: string[];
}

export interface PresenceUpdatePayload {
  userId: string;
  userType: 'user' | 'candidate';
  status: PresenceStatus;
  tenantId?: string;
  timestamp: Date;
}

export const setStatusSchema = z.object({
  status: z.enum(['online', 'away', 'busy']),
});

export type SetStatusPayload = z.infer<typeof setStatusSchema>;

// --- Rate Limiting ---

export interface SocketRateLimitConfig {
  maxEvents: number;
  windowMs: number;
}

export const SOCKET_RATE_LIMITS: Record<string, SocketRateLimitConfig> = {
  connection: { maxEvents: 10, windowMs: 60000 },
  presence: { maxEvents: 30, windowMs: 60000 },
  message: { maxEvents: 100, windowMs: 60000 },
};

// --- Metrics ---

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

export const SOCKET_SLOS = {
  CONNECTION_LATENCY_P99_MS: 200,
  CONNECTION_SUCCESS_RATE: 99.9,
  MESSAGE_LATENCY_P99_MS: 100,
  AVAILABILITY_RATE: 99.95,
  MAX_AUTH_FAILURES_PER_MINUTE: 50,
} as const;

// --- Audit ---

export type SocketAuditEventType =
  | 'SOCKET_CONNECTED'
  | 'SOCKET_DISCONNECTED'
  | 'SOCKET_AUTH_SUCCESS'
  | 'SOCKET_AUTH_FAILURE'
  | 'SOCKET_SUBSCRIPTION_GRANTED'
  | 'SOCKET_SUBSCRIPTION_DENIED'
  | 'SOCKET_RATE_LIMITED';

// --- Room Helpers ---

export function getTenantRoom(tenantId: string): string {
  return `tenant:${tenantId}`;
}

export function getUserRoom(userId: string): string {
  return `user:${userId}`;
}

export function getPresenceRoom(tenantId: string): string {
  return `presence:${tenantId}`;
}
