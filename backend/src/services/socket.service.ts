/**
 * Socket Service
 * Task 1.2, 1.3: Socket.IO server initialization, authorization, and presence tracking
 */

import type { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import type {
  SocketAuthData,
  UserPresence,
  PresenceStatus,
  PresenceUpdatePayload,
} from '../models/socket.model.js';
import {
  SOCKET_NAMESPACES,
  SERVER_EVENTS,
  CLIENT_EVENTS,
  socketAuthSchema,
  setStatusSchema,
  getTenantRoom,
  getUserRoom,
  getPresenceRoom,
  SOCKET_RATE_LIMITS,
} from '../models/socket.model.js';
import { tokenService } from './token.service.js';
import { auditService } from './audit.service.js';
import { socketMetricsService } from './socket-metrics.service.js';

// Extended socket type with auth data
interface AuthenticatedSocket extends Socket {
  data: SocketAuthData;
}

// In-memory presence store (would use Redis in production for horizontal scaling)
const presenceStore = new Map<string, UserPresence>();

// Rate limiting state per socket
const socketRateLimits = new Map<string, Map<string, { count: number; resetAt: number }>>();

/**
 * Socket Service
 * Manages Socket.IO server, authentication, and presence
 */
export class SocketService {
  private io: Server | null = null;

  /**
   * Initialize Socket.IO server and attach to HTTP server
   */
  initialize(httpServer: HttpServer): Server {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        credentials: true,
      },
      pingTimeout: 20000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
    });

    // Set up middleware and handlers for root namespace
    this.setupNamespace(this.io);

    // Set up presence namespace
    const presenceNs = this.io.of(SOCKET_NAMESPACES.PRESENCE);
    this.setupNamespace(presenceNs);
    this.setupPresenceHandlers(presenceNs);

    // Set up notifications namespace
    const notificationsNs = this.io.of(SOCKET_NAMESPACES.NOTIFICATIONS);
    this.setupNamespace(notificationsNs);

    console.log('[Socket] Socket.IO server initialized');
    return this.io;
  }

  /**
   * Set up authentication middleware and base handlers for a namespace
   */
  private setupNamespace(namespace: Server | ReturnType<Server['of']>): void {
    // Authentication middleware
    namespace.use(async (socket, next) => {
      const startTime = Date.now();
      const clientIp = socket.handshake.address;
      const userAgent = socket.handshake.headers['user-agent'];

      try {
        // Check connection rate limit
        if (!this.checkRateLimit(clientIp, 'connection', SOCKET_RATE_LIMITS.connection)) {
          socketMetricsService.recordRateLimited('connection');
          auditService.log({
            eventType: 'SOCKET_RATE_LIMITED',
            channel: 'socket',
            ipAddress: clientIp,
            userAgent,
            metadata: { reason: 'connection rate limit exceeded', namespace: socket.nsp.name },
            success: false,
            errorMessage: 'Connection rate limit exceeded',
          });
          return next(new Error('Rate limit exceeded'));
        }

        // Validate auth payload
        const authResult = socketAuthSchema.safeParse(socket.handshake.auth);
        if (!authResult.success) {
          socketMetricsService.recordConnectionFailure('invalid_auth');
          auditService.log({
            eventType: 'SOCKET_AUTH_FAILURE',
            channel: 'socket',
            ipAddress: clientIp,
            userAgent,
            metadata: { reason: 'Invalid auth payload', namespace: socket.nsp.name },
            success: false,
            errorMessage: 'Invalid authentication payload',
          });
          return next(new Error('Invalid authentication payload'));
        }

        // Validate token
        const tokenPayload = await tokenService.validateAccessToken(authResult.data.token);
        if (!tokenPayload) {
          socketMetricsService.recordConnectionFailure('invalid_token');
          auditService.log({
            eventType: 'SOCKET_AUTH_FAILURE',
            channel: 'socket',
            ipAddress: clientIp,
            userAgent,
            metadata: { reason: 'Invalid or expired token', namespace: socket.nsp.name },
            success: false,
            errorMessage: 'Invalid or expired token',
          });
          return next(new Error('Invalid or expired token'));
        }

        // Attach auth data to socket
        const authData: SocketAuthData = {
          userId: tokenPayload.sub,
          userType: tokenPayload.type,
          tenantId: (tokenPayload as any).tenantId,
          roles: (tokenPayload as any).roles,
          authenticatedAt: new Date(),
        };
        socket.data = authData;

        const latency = Date.now() - startTime;
        socketMetricsService.recordConnectionLatency(latency);
        socketMetricsService.recordConnectionSuccess();

        // Log successful auth
        auditService.log({
          eventType: 'SOCKET_AUTH_SUCCESS',
          actorId: authData.userId,
          actorType: authData.userType,
          channel: 'socket',
          ipAddress: clientIp,
          userAgent,
          metadata: { namespace: socket.nsp.name, socketId: socket.id },
          success: true,
        });

        next();
      } catch (error) {
        socketMetricsService.recordConnectionFailure('error');
        console.error('[Socket] Auth error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Connection handler
    namespace.on('connection', (socket: AuthenticatedSocket) => {
      const { userId, userType, tenantId } = socket.data;
      const clientIp = socket.handshake.address;
      const userAgent = socket.handshake.headers['user-agent'];

      // Join user-specific room
      socket.join(getUserRoom(userId));

      // Join tenant room if tenant-scoped
      if (tenantId) {
        socket.join(getTenantRoom(tenantId));
      }

      // Log connection
      auditService.log({
        eventType: 'SOCKET_CONNECTED',
        actorId: userId,
        actorType: userType,
        channel: 'socket',
        ipAddress: clientIp,
        userAgent,
        metadata: { namespace: socket.nsp.name, socketId: socket.id, tenantId },
        success: true,
      });

      // Send connection acknowledgment
      socket.emit(SERVER_EVENTS.CONNECTION_ACK, {
        socketId: socket.id,
        userId,
        timestamp: new Date().toISOString(),
      });

      // Initialize rate limit tracking for this socket
      socketRateLimits.set(socket.id, new Map());

      // Handle ping for keepalive
      socket.on(CLIENT_EVENTS.PING, (callback) => {
        if (typeof callback === 'function') {
          callback({ pong: true, timestamp: Date.now() });
        }
      });

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        socketMetricsService.recordDisconnection(reason);
        auditService.log({
          eventType: 'SOCKET_DISCONNECTED',
          actorId: userId,
          actorType: userType,
          channel: 'socket',
          ipAddress: clientIp,
          metadata: { namespace: socket.nsp.name, socketId: socket.id, reason },
          success: true,
        });

        // Clean up rate limit tracking
        socketRateLimits.delete(socket.id);

        // Update presence on disconnect
        this.handleUserDisconnect(socket);
      });
    });
  }

  /**
   * Set up presence-specific handlers
   */
  private setupPresenceHandlers(namespace: ReturnType<Server['of']>): void {
    namespace.on('connection', (socket: AuthenticatedSocket) => {
      const { userId, userType, tenantId } = socket.data;

      // Update presence on connect
      this.updatePresence(userId, userType, 'online', tenantId, socket.id);

      // Join presence room for tenant
      if (tenantId) {
        socket.join(getPresenceRoom(tenantId));
      }

      // Handle set status
      socket.on(CLIENT_EVENTS.SET_STATUS, (data, callback) => {
        // Rate limit check
        if (!this.checkSocketRateLimit(socket.id, 'presence', SOCKET_RATE_LIMITS.presence)) {
          socket.emit(SERVER_EVENTS.RATE_LIMITED, { event: CLIENT_EVENTS.SET_STATUS });
          if (typeof callback === 'function') {
            callback({ error: 'Rate limit exceeded' });
          }
          return;
        }

        const result = setStatusSchema.safeParse(data);
        if (!result.success) {
          if (typeof callback === 'function') {
            callback({ error: 'Invalid status' });
          }
          return;
        }

        this.updatePresence(userId, userType, result.data.status, tenantId, socket.id);
        if (typeof callback === 'function') {
          callback({ success: true, status: result.data.status });
        }
      });

      // Handle get status
      socket.on(CLIENT_EVENTS.GET_STATUS, (data: { userIds: string[] }, callback) => {
        if (!Array.isArray(data?.userIds)) {
          if (typeof callback === 'function') {
            callback({ error: 'Invalid request' });
          }
          return;
        }

        const statuses: Record<string, PresenceStatus> = {};
        for (const uid of data.userIds.slice(0, 100)) {
          const presence = presenceStore.get(uid);
          statuses[uid] = presence?.status || 'offline';
        }

        if (typeof callback === 'function') {
          callback({ statuses });
        }
      });

      // Handle subscribe to presence updates
      socket.on(CLIENT_EVENTS.SUBSCRIBE_PRESENCE, (data: { tenantId?: string }, callback) => {
        const targetTenantId = data?.tenantId || tenantId;
        
        // Enforce tenant isolation
        if (targetTenantId && targetTenantId !== tenantId) {
          auditService.log({
            eventType: 'SOCKET_SUBSCRIPTION_DENIED',
            actorId: userId,
            actorType: userType,
            channel: 'socket',
            ipAddress: socket.handshake.address,
            metadata: {
              namespace: socket.nsp.name,
              requestedTenant: targetTenantId,
              userTenant: tenantId,
            },
            success: false,
            errorMessage: 'Cross-tenant subscription denied',
          });
          if (typeof callback === 'function') {
            callback({ error: 'Access denied' });
          }
          return;
        }

        if (targetTenantId) {
          socket.join(getPresenceRoom(targetTenantId));
          auditService.log({
            eventType: 'SOCKET_SUBSCRIPTION_GRANTED',
            actorId: userId,
            actorType: userType,
            channel: 'socket',
            ipAddress: socket.handshake.address,
            metadata: { namespace: socket.nsp.name, room: getPresenceRoom(targetTenantId) },
            success: true,
          });
        }

        if (typeof callback === 'function') {
          callback({ success: true });
        }
      });

      // Handle unsubscribe
      socket.on(CLIENT_EVENTS.UNSUBSCRIBE_PRESENCE, (data: { tenantId?: string }, callback) => {
        const targetTenantId = data?.tenantId || tenantId;
        if (targetTenantId) {
          socket.leave(getPresenceRoom(targetTenantId));
        }
        if (typeof callback === 'function') {
          callback({ success: true });
        }
      });
    });
  }

  /**
   * Update user presence and broadcast to relevant rooms
   */
  updatePresence(
    userId: string,
    userType: 'user' | 'candidate',
    status: PresenceStatus,
    tenantId?: string,
    socketId?: string
  ): void {
    const existing = presenceStore.get(userId);
    const now = new Date();

    const presence: UserPresence = {
      userId,
      userType,
      status,
      tenantId,
      lastSeen: now,
      socketIds: existing?.socketIds || [],
    };

    // Add socket ID if provided and not already tracked
    if (socketId && !presence.socketIds.includes(socketId)) {
      presence.socketIds.push(socketId);
    }

    presenceStore.set(userId, presence);
    socketMetricsService.recordPresenceUpdate(status);

    // Broadcast presence update
    const update: PresenceUpdatePayload = {
      userId,
      userType,
      status,
      tenantId,
      timestamp: now,
    };

    // Broadcast to tenant presence room if tenant-scoped
    if (tenantId && this.io) {
      const presenceNs = this.io.of(SOCKET_NAMESPACES.PRESENCE);
      presenceNs.to(getPresenceRoom(tenantId)).emit(SERVER_EVENTS.PRESENCE_UPDATE, update);
      
      if (status === 'online' && !existing) {
        presenceNs.to(getPresenceRoom(tenantId)).emit(SERVER_EVENTS.USER_ONLINE, update);
      }
    }
  }

  /**
   * Handle user disconnect - update presence and clean up
   */
  private handleUserDisconnect(socket: AuthenticatedSocket): void {
    const { userId, userType, tenantId } = socket.data;
    const presence = presenceStore.get(userId);

    if (!presence) return;

    // Remove this socket from tracking
    presence.socketIds = presence.socketIds.filter((id) => id !== socket.id);

    if (presence.socketIds.length === 0) {
      // No more active sockets - user is offline
      presence.status = 'offline';
      presence.lastSeen = new Date();
      presenceStore.set(userId, presence);

      // Broadcast offline status
      if (tenantId && this.io) {
        const update: PresenceUpdatePayload = {
          userId,
          userType,
          status: 'offline',
          tenantId,
          timestamp: new Date(),
        };
        const presenceNs = this.io.of(SOCKET_NAMESPACES.PRESENCE);
        presenceNs.to(getPresenceRoom(tenantId)).emit(SERVER_EVENTS.USER_OFFLINE, update);
        presenceNs.to(getPresenceRoom(tenantId)).emit(SERVER_EVENTS.PRESENCE_UPDATE, update);
      }
    }
  }

  /**
   * Check rate limit (IP-based for connections)
   */
  private checkRateLimit(key: string, category: string, config: { maxEvents: number; windowMs: number }): boolean {
    const now = Date.now();
    const limitKey = `${category}:${key}`;
    
    // Use a simple in-memory map for now
    const limits = socketRateLimits.get('global') || new Map();
    if (!socketRateLimits.has('global')) {
      socketRateLimits.set('global', limits);
    }

    const window = limits.get(limitKey);
    if (!window || window.resetAt < now) {
      limits.set(limitKey, { count: 1, resetAt: now + config.windowMs });
      return true;
    }

    window.count += 1;
    return window.count <= config.maxEvents;
  }

  /**
   * Check rate limit for a specific socket
   */
  private checkSocketRateLimit(
    socketId: string,
    category: string,
    config: { maxEvents: number; windowMs: number }
  ): boolean {
    const now = Date.now();
    const limits = socketRateLimits.get(socketId);
    if (!limits) return true;

    const window = limits.get(category);
    if (!window || window.resetAt < now) {
      limits.set(category, { count: 1, resetAt: now + config.windowMs });
      return true;
    }

    window.count += 1;
    if (window.count > config.maxEvents) {
      socketMetricsService.recordRateLimited(category);
      return false;
    }
    return true;
  }

  /**
   * Get presence for a user
   */
  getPresence(userId: string): UserPresence | undefined {
    return presenceStore.get(userId);
  }

  /**
   * Get all online users for a tenant
   */
  getOnlineUsers(tenantId: string): UserPresence[] {
    const online: UserPresence[] = [];
    for (const presence of presenceStore.values()) {
      if (presence.tenantId === tenantId && presence.status !== 'offline') {
        online.push(presence);
      }
    }
    return online;
  }

  /**
   * Get the Socket.IO server instance
   */
  getIO(): Server | null {
    return this.io;
  }

  /**
   * Get active connection count
   */
  async getActiveConnectionCount(): Promise<number> {
    if (!this.io) return 0;
    const sockets = await this.io.fetchSockets();
    return sockets.length;
  }

  /**
   * Emit to a specific user across all their sockets
   */
  emitToUser(userId: string, event: string, payload: unknown): void {
    if (!this.io) return;
    this.io.to(getUserRoom(userId)).emit(event, payload);
    socketMetricsService.recordMessageSent(event);
  }

  /**
   * Emit to all users in a tenant
   */
  emitToTenant(tenantId: string, event: string, payload: unknown): void {
    if (!this.io) return;
    this.io.to(getTenantRoom(tenantId)).emit(event, payload);
    socketMetricsService.recordMessageSent(event);
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (this.io) {
      console.log('[Socket] Shutting down Socket.IO server...');
      
      // Notify all clients
      this.io.emit(SERVER_EVENTS.CONNECTION_ERROR, { reason: 'server_shutdown' });
      
      // Close all connections
      this.io.disconnectSockets(true);
      
      // Close the server
      await new Promise<void>((resolve) => {
        this.io!.close(() => {
          console.log('[Socket] Socket.IO server closed');
          resolve();
        });
      });
      
      this.io = null;
    }
    
    // Clear stores
    presenceStore.clear();
    socketRateLimits.clear();
  }
}

export const socketService = new SocketService();
