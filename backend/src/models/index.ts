export * from './auth.model.js';
export * from './audit.model.js';
export * from './state-store.model.js';
export * from './shell.model.js';
// Exclude PresenceStatus from socket.model (already exported from state-store.model)
export {
  SOCKET_NAMESPACES,
  SERVER_EVENTS,
  CLIENT_EVENTS,
  SOCKET_RATE_LIMITS,
  SOCKET_METRICS,
  SOCKET_SLOS,
  socketAuthSchema,
  setStatusSchema,
  getTenantRoom,
  getUserRoom,
  getPresenceRoom,
  type SocketNamespace,
  type ServerEvent,
  type ClientEvent,
  type SocketAuthData,
  type SocketAuthPayload,
  type UserPresence,
  type PresenceUpdatePayload,
  type SetStatusPayload,
  type SocketRateLimitConfig,
  type SocketAuditEventType,
} from './socket.model.js';
export * from './firebase.model.js';
