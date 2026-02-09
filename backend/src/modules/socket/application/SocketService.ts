/**
 * SocketService — Application-layer service managing Socket.IO lifecycle, auth, and presence.
 * This is NOT an Express-routes module; it attaches to an HTTP server.
 */
import type { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import type { IAuditService } from '../../domain/ports/IAuditService.js';
import type { ITokenService } from '../../domain/ports/ITokenService.js';
import type { ISocketMetricsService } from '../../domain/ports/ISocketMetricsService.js';
import type {
  SocketAuthData,
  UserPresence,
  PresenceStatus,
  PresenceUpdatePayload,
} from '../../domain/entities/index.js';
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
} from '../../domain/entities/index.js';

interface AuthenticatedSocket extends Socket {
  data: SocketAuthData;
}

const presenceStore = new Map<string, UserPresence>();
const lastHeartbeat = new Map<string, number>();
const PRESENCE_TTL_MS = 60000;
const PRESENCE_CLEANUP_INTERVAL_MS = 30000;
const rateLimits = new Map<string, Map<string, { count: number; resetAt: number }>>();

export class SocketService {
  private io: Server | null = null;
  private presenceCleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly auditService: IAuditService,
    private readonly tokenService: ITokenService,
    private readonly metricsService: ISocketMetricsService,
  ) {}

  private getAllowedOrigins(): string[] {
    const envOrigins = process.env.CORS_ORIGIN;
    if (envOrigins) {
      return envOrigins.split(',').map((o) => o.trim()).filter(Boolean);
    }
    return ['http://localhost:6312', 'http://localhost:6313', 'http://127.0.0.1:6312', 'http://127.0.0.1:6313'];
  }

  initialize(httpServer: HttpServer): Server {
    const allowedOrigins = this.getAllowedOrigins();
    console.log('[Socket] CORS allowed origins:', allowedOrigins);

    this.io = new Server(httpServer, {
      cors: { origin: allowedOrigins, credentials: true },
      pingTimeout: 20000,
      pingInterval: 25000,
      transports: ['websocket', 'polling'],
    });

    this.setupNamespace(this.io);

    const presenceNs = this.io.of(SOCKET_NAMESPACES.PRESENCE);
    this.setupNamespace(presenceNs);
    this.setupPresenceHandlers(presenceNs);

    const notificationsNs = this.io.of(SOCKET_NAMESPACES.NOTIFICATIONS);
    this.setupNamespace(notificationsNs);

    this.startPresenceCleanup();

    console.log('[Socket] Socket.IO server initialized');
    return this.io;
  }

  private setupNamespace(namespace: Server | ReturnType<Server['of']>): void {
    namespace.use(async (socket, next) => {
      const startTime = Date.now();
      const clientIp = socket.handshake.address;
      const userAgent = socket.handshake.headers['user-agent'];

      try {
        if (!this.checkRateLimit(clientIp, 'connection', SOCKET_RATE_LIMITS.connection)) {
          this.metricsService.recordRateLimited('connection');
          this.auditService.log({
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

        const authResult = socketAuthSchema.safeParse(socket.handshake.auth);
        if (!authResult.success) {
          this.metricsService.recordConnectionFailure('invalid_auth');
          this.auditService.log({
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

        const tokenPayload = await this.tokenService.validateAccessToken(authResult.data.token);
        if (!tokenPayload) {
          this.metricsService.recordConnectionFailure('invalid_token');
          this.auditService.log({
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

        const authData: SocketAuthData = {
          userId: tokenPayload.sub,
          userType: tokenPayload.type,
          tenantId: tokenPayload.tenantId,
          roles: tokenPayload.roles,
          authenticatedAt: new Date(),
        };
        socket.data = authData;

        const latency = Date.now() - startTime;
        this.metricsService.recordConnectionLatency(latency);
        this.metricsService.recordConnectionSuccess();

        this.auditService.log({
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
        this.metricsService.recordConnectionFailure('error');
        console.error('[Socket] Auth error:', error);
        next(new Error('Authentication failed'));
      }
    });

    namespace.on('connection', (socket: AuthenticatedSocket) => {
      const { userId, userType, tenantId } = socket.data;
      const clientIp = socket.handshake.address;
      const userAgent = socket.handshake.headers['user-agent'];

      socket.join(getUserRoom(userId));
      if (tenantId) socket.join(getTenantRoom(tenantId));

      this.auditService.log({
        eventType: 'SOCKET_CONNECTED',
        actorId: userId,
        actorType: userType,
        channel: 'socket',
        ipAddress: clientIp,
        userAgent,
        metadata: { namespace: socket.nsp.name, socketId: socket.id, tenantId },
        success: true,
      });

      socket.emit(SERVER_EVENTS.CONNECTION_ACK, {
        socketId: socket.id,
        userId,
        timestamp: new Date().toISOString(),
      });

      lastHeartbeat.set(socket.id, Date.now());

      socket.on(CLIENT_EVENTS.PING, (callback) => {
        lastHeartbeat.set(socket.id, Date.now());
        if (typeof callback === 'function') callback({ pong: true, timestamp: Date.now() });
      });

      socket.on('disconnect', (reason) => {
        this.metricsService.recordDisconnection(reason);
        this.auditService.log({
          eventType: 'SOCKET_DISCONNECTED',
          actorId: userId,
          actorType: userType,
          channel: 'socket',
          ipAddress: clientIp,
          metadata: { namespace: socket.nsp.name, socketId: socket.id, reason },
          success: true,
        });
        lastHeartbeat.delete(socket.id);
        this.handleUserDisconnect(socket);
      });
    });
  }

  private setupPresenceHandlers(namespace: ReturnType<Server['of']>): void {
    namespace.on('connection', (socket: AuthenticatedSocket) => {
      const { userId, userType, tenantId } = socket.data;

      this.updatePresence(userId, userType, 'online', tenantId, socket.id);
      if (tenantId) socket.join(getPresenceRoom(tenantId));

      socket.on(CLIENT_EVENTS.SET_STATUS, (data, callback) => {
        const rateLimitKey = this.getRateLimitKey(socket);
        if (!this.checkRateLimitByKey(rateLimitKey, 'presence', SOCKET_RATE_LIMITS.presence)) {
          socket.emit(SERVER_EVENTS.RATE_LIMITED, { event: CLIENT_EVENTS.SET_STATUS });
          if (typeof callback === 'function') callback({ error: 'Rate limit exceeded' });
          return;
        }

        const result = setStatusSchema.safeParse(data);
        if (!result.success) {
          if (typeof callback === 'function') callback({ error: 'Invalid status' });
          return;
        }

        this.updatePresence(userId, userType, result.data.status, tenantId, socket.id);
        if (typeof callback === 'function') callback({ success: true, status: result.data.status });
      });

      socket.on(CLIENT_EVENTS.GET_STATUS, (data: { userIds: string[] }, callback) => {
        if (!Array.isArray(data?.userIds)) {
          if (typeof callback === 'function') callback({ error: 'Invalid request' });
          return;
        }

        const statuses: Record<string, PresenceStatus> = {};
        for (const uid of data.userIds.slice(0, 100)) {
          const presence = presenceStore.get(uid);
          statuses[uid] = presence?.status || 'offline';
        }
        if (typeof callback === 'function') callback({ statuses });
      });

      socket.on(CLIENT_EVENTS.SUBSCRIBE_PRESENCE, (data: { tenantId?: string }, callback) => {
        const targetTenantId = data?.tenantId || tenantId;
        if (targetTenantId && targetTenantId !== tenantId) {
          this.auditService.log({
            eventType: 'SOCKET_SUBSCRIPTION_DENIED',
            actorId: userId,
            actorType: userType,
            channel: 'socket',
            ipAddress: socket.handshake.address,
            metadata: { namespace: socket.nsp.name, requestedTenant: targetTenantId, userTenant: tenantId },
            success: false,
            errorMessage: 'Cross-tenant subscription denied',
          });
          if (typeof callback === 'function') callback({ error: 'Access denied' });
          return;
        }
        if (targetTenantId) {
          socket.join(getPresenceRoom(targetTenantId));
          this.auditService.log({
            eventType: 'SOCKET_SUBSCRIPTION_GRANTED',
            actorId: userId,
            actorType: userType,
            channel: 'socket',
            ipAddress: socket.handshake.address,
            metadata: { namespace: socket.nsp.name, room: getPresenceRoom(targetTenantId) },
            success: true,
          });
        }
        if (typeof callback === 'function') callback({ success: true });
      });

      socket.on(CLIENT_EVENTS.UNSUBSCRIBE_PRESENCE, (data: { tenantId?: string }, callback) => {
        const targetTenantId = data?.tenantId || tenantId;
        if (targetTenantId) socket.leave(getPresenceRoom(targetTenantId));
        if (typeof callback === 'function') callback({ success: true });
      });
    });
  }

  updatePresence(
    userId: string,
    userType: 'user' | 'candidate',
    status: PresenceStatus,
    tenantId?: string,
    socketId?: string,
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

    if (socketId && !presence.socketIds.includes(socketId)) {
      presence.socketIds.push(socketId);
    }

    presenceStore.set(userId, presence);
    this.metricsService.recordPresenceUpdate(status);

    const update: PresenceUpdatePayload = { userId, userType, status, tenantId, timestamp: now };

    if (tenantId && this.io) {
      const presenceNs = this.io.of(SOCKET_NAMESPACES.PRESENCE);
      presenceNs.to(getPresenceRoom(tenantId)).emit(SERVER_EVENTS.PRESENCE_UPDATE, update);
      if (status === 'online' && !existing) {
        presenceNs.to(getPresenceRoom(tenantId)).emit(SERVER_EVENTS.USER_ONLINE, update);
      }
    }
  }

  private handleUserDisconnect(socket: AuthenticatedSocket): void {
    const { userId, userType, tenantId } = socket.data;
    const presence = presenceStore.get(userId);
    if (!presence) return;

    presence.socketIds = presence.socketIds.filter((id) => id !== socket.id);

    if (presence.socketIds.length === 0) {
      presence.status = 'offline';
      presence.lastSeen = new Date();
      presenceStore.set(userId, presence);

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

  private getRateLimitKey(socket: AuthenticatedSocket): string {
    return socket.data?.userId || socket.handshake.address;
  }

  private checkRateLimitByKey(
    key: string,
    category: string,
    config: { maxEvents: number; windowMs: number },
  ): boolean {
    const now = Date.now();
    const limitKey = `${category}:${key}`;

    let limits = rateLimits.get('global');
    if (!limits) {
      limits = new Map();
      rateLimits.set('global', limits);
    }

    const window = limits.get(limitKey);
    if (!window || window.resetAt < now) {
      limits.set(limitKey, { count: 1, resetAt: now + config.windowMs });
      return true;
    }

    window.count += 1;
    if (window.count > config.maxEvents) {
      this.metricsService.recordRateLimited(category);
      return false;
    }
    return true;
  }

  private checkRateLimit(
    key: string,
    category: string,
    config: { maxEvents: number; windowMs: number },
  ): boolean {
    return this.checkRateLimitByKey(key, category, config);
  }

  private startPresenceCleanup(): void {
    this.presenceCleanupInterval = setInterval(() => {
      const now = Date.now();
      const staleSocketIds: string[] = [];

      for (const [socketId, timestamp] of lastHeartbeat) {
        if (now - timestamp > PRESENCE_TTL_MS) staleSocketIds.push(socketId);
      }

      for (const socketId of staleSocketIds) {
        lastHeartbeat.delete(socketId);
        for (const [userId, presence] of presenceStore) {
          if (presence.socketIds.includes(socketId)) {
            presence.socketIds = presence.socketIds.filter((id) => id !== socketId);
            if (presence.socketIds.length === 0) {
              presence.status = 'offline';
              presence.lastSeen = new Date();
              if (presence.tenantId && this.io) {
                const update: PresenceUpdatePayload = {
                  userId,
                  userType: presence.userType,
                  status: 'offline',
                  tenantId: presence.tenantId,
                  timestamp: new Date(),
                };
                const presenceNs = this.io.of(SOCKET_NAMESPACES.PRESENCE);
                presenceNs.to(getPresenceRoom(presence.tenantId)).emit(SERVER_EVENTS.USER_OFFLINE, update);
                presenceNs.to(getPresenceRoom(presence.tenantId)).emit(SERVER_EVENTS.PRESENCE_UPDATE, update);
              }
            }
          }
        }
      }
    }, PRESENCE_CLEANUP_INTERVAL_MS);
  }

  getPresence(userId: string): UserPresence | undefined {
    return presenceStore.get(userId);
  }

  getOnlineUsers(tenantId: string): UserPresence[] {
    const online: UserPresence[] = [];
    for (const presence of presenceStore.values()) {
      if (presence.tenantId === tenantId && presence.status !== 'offline') online.push(presence);
    }
    return online;
  }

  getIO(): Server | null {
    return this.io;
  }

  async getActiveConnectionCount(): Promise<number> {
    if (!this.io) return 0;
    const sockets = await this.io.fetchSockets();
    return sockets.length;
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    if (!this.io) return;
    this.io.to(getUserRoom(userId)).emit(event, payload);
    this.metricsService.recordMessageSent(event);
  }

  emitToTenant(tenantId: string, event: string, payload: unknown): void {
    if (!this.io) return;
    this.io.to(getTenantRoom(tenantId)).emit(event, payload);
    this.metricsService.recordMessageSent(event);
  }

  async shutdown(): Promise<void> {
    if (this.io) {
      console.log('[Socket] Shutting down Socket.IO server...');
      this.io.emit(SERVER_EVENTS.CONNECTION_ERROR, { reason: 'server_shutdown' });
      this.io.disconnectSockets(true);
      await new Promise<void>((resolve) => {
        this.io!.close(() => { console.log('[Socket] Socket.IO server closed'); resolve(); });
      });
      this.io = null;
    }

    if (this.presenceCleanupInterval) {
      clearInterval(this.presenceCleanupInterval);
      this.presenceCleanupInterval = null;
    }

    presenceStore.clear();
    lastHeartbeat.clear();
    rateLimits.clear();
  }
}
