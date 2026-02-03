/**
 * Socket Infrastructure Tests
 * Task 1.4: Tests for socket connections, event handling, presence, and rate limiting
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createServer, type Server as HttpServer } from 'http';
import { AddressInfo } from 'net';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';

import './setup.js';
import { SocketService } from '../src/services/socket.service.js';
import { socketMetricsService } from '../src/services/socket-metrics.service.js';
import { tokenService } from '../src/services/token.service.js';
import {
  SOCKET_NAMESPACES,
  SERVER_EVENTS,
  CLIENT_EVENTS,
  SOCKET_METRICS,
  SOCKET_SLOS,
} from '../src/models/socket.model.js';

// Create a fresh socket service for each test
let socketService: SocketService;
let httpServer: HttpServer;
let serverUrl: string;

// Helper to create authenticated client
async function createAuthenticatedClient(
  namespace: string = '/',
  userId = 'test-user-1',
  userType: 'user' | 'candidate' = 'user'
): Promise<{ client: ClientSocket; token: string }> {
  const { tokenPair } = await tokenService.generateTokenPair(userId, userType);
  
  const client = ioClient(`${serverUrl}${namespace}`, {
    auth: { token: tokenPair.accessToken },
    transports: ['websocket'],
    autoConnect: false,
    timeout: 5000,
  });

  return { client, token: tokenPair.accessToken };
}

// Helper to wait for event
function waitForEvent<T>(client: ClientSocket, event: string, timeout = 2000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeout);

    client.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

// Helper to wait for connection
function waitForConnect(client: ClientSocket, timeout = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Connection timeout'));
    }, timeout);

    client.once('connect', () => {
      clearTimeout(timer);
      resolve();
    });

    client.once('connect_error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

describe('Socket Infrastructure', () => {
  beforeEach(async () => {
    // Reset metrics
    socketMetricsService.reset();
    
    // Create new HTTP server and socket service
    httpServer = createServer();
    socketService = new SocketService();
    socketService.initialize(httpServer);

    // Start server on random port
    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => resolve());
    });
    
    const address = httpServer.address() as AddressInfo;
    serverUrl = `http://localhost:${address.port}`;
  });

  afterEach(async () => {
    await socketService.shutdown();
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  describe('Socket Server Initialization', () => {
    it('should initialize Socket.IO server', () => {
      const io = socketService.getIO();
      expect(io).toBeDefined();
    });

    it('should have presence namespace', () => {
      const io = socketService.getIO();
      expect(io?.of(SOCKET_NAMESPACES.PRESENCE)).toBeDefined();
    });

    it('should have notifications namespace', () => {
      const io = socketService.getIO();
      expect(io?.of(SOCKET_NAMESPACES.NOTIFICATIONS)).toBeDefined();
    });
  });

  describe('Socket Authentication', () => {
    it('should authenticate client with valid token', async () => {
      const { client } = await createAuthenticatedClient();
      
      client.connect();
      await waitForConnect(client);
      
      expect(client.connected).toBe(true);
      client.disconnect();
    });

    it('should reject connection without token', async () => {
      const client = ioClient(serverUrl, {
        auth: {},
        transports: ['websocket'],
        autoConnect: false,
        timeout: 2000,
      });

      client.connect();
      
      await expect(waitForConnect(client)).rejects.toThrow();
      client.disconnect();
    });

    it('should reject connection with invalid token', async () => {
      const client = ioClient(serverUrl, {
        auth: { token: 'invalid-token' },
        transports: ['websocket'],
        autoConnect: false,
        timeout: 2000,
      });

      client.connect();
      
      await expect(waitForConnect(client)).rejects.toThrow();
      client.disconnect();
    });

    it('should send connection acknowledgment on connect', async () => {
      const { client } = await createAuthenticatedClient('/', 'ack-test-user');
      
      const ackPromise = waitForEvent<{ socketId: string; userId: string }>(
        client,
        SERVER_EVENTS.CONNECTION_ACK
      );
      
      client.connect();
      const ack = await ackPromise;
      
      expect(ack.socketId).toBeDefined();
      expect(ack.userId).toBe('ack-test-user');
      
      client.disconnect();
    });
  });

  describe('Presence Tracking', () => {
    it('should track user presence on connect', async () => {
      const userId = 'presence-test-user';
      const { client } = await createAuthenticatedClient(SOCKET_NAMESPACES.PRESENCE, userId);
      
      client.connect();
      await waitForConnect(client);

      // Give some time for presence update
      await new Promise((r) => setTimeout(r, 100));

      const presence = socketService.getPresence(userId);
      expect(presence).toBeDefined();
      expect(presence?.status).toBe('online');
      expect(presence?.userId).toBe(userId);
      
      client.disconnect();
    });

    it('should update presence status', async () => {
      const userId = 'status-test-user';
      const { client } = await createAuthenticatedClient(SOCKET_NAMESPACES.PRESENCE, userId);
      
      client.connect();
      await waitForConnect(client);

      const response = await new Promise<{ success: boolean; status: string }>((resolve) => {
        client.emit(CLIENT_EVENTS.SET_STATUS, { status: 'away' }, resolve);
      });

      expect(response.success).toBe(true);
      expect(response.status).toBe('away');

      const presence = socketService.getPresence(userId);
      expect(presence?.status).toBe('away');
      
      client.disconnect();
    });

    it('should get presence status for multiple users', async () => {
      const user1Id = 'batch-user-1';
      const user2Id = 'batch-user-2';
      
      const { client: client1 } = await createAuthenticatedClient(SOCKET_NAMESPACES.PRESENCE, user1Id);
      const { client: client2 } = await createAuthenticatedClient(SOCKET_NAMESPACES.PRESENCE, user2Id);
      const { client: queryClient } = await createAuthenticatedClient(SOCKET_NAMESPACES.PRESENCE, 'query-user');
      
      client1.connect();
      client2.connect();
      queryClient.connect();
      
      await Promise.all([
        waitForConnect(client1),
        waitForConnect(client2),
        waitForConnect(queryClient),
      ]);

      await new Promise((r) => setTimeout(r, 100));

      const response = await new Promise<{ statuses: Record<string, string> }>((resolve) => {
        queryClient.emit(CLIENT_EVENTS.GET_STATUS, { userIds: [user1Id, user2Id, 'nonexistent'] }, resolve);
      });

      expect(response.statuses[user1Id]).toBe('online');
      expect(response.statuses[user2Id]).toBe('online');
      expect(response.statuses['nonexistent']).toBe('offline');
      
      client1.disconnect();
      client2.disconnect();
      queryClient.disconnect();
    });

    it('should mark user offline on disconnect', async () => {
      const userId = 'disconnect-test-user';
      const { client } = await createAuthenticatedClient(SOCKET_NAMESPACES.PRESENCE, userId);
      
      client.connect();
      await waitForConnect(client);
      
      await new Promise((r) => setTimeout(r, 100));
      expect(socketService.getPresence(userId)?.status).toBe('online');

      client.disconnect();
      
      await new Promise((r) => setTimeout(r, 100));
      expect(socketService.getPresence(userId)?.status).toBe('offline');
    });
  });

  describe('Tenant Isolation', () => {
    it('should deny cross-tenant subscription', async () => {
      // Mock tenant in token
      vi.spyOn(tokenService, 'validateAccessToken').mockResolvedValueOnce({
        sub: 'tenant-user',
        type: 'user',
        tenantId: 'tenant-a',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        jti: 'test-jti',
      } as any);

      const { tokenPair } = await tokenService.generateTokenPair('tenant-user', 'user');
      const client = ioClient(`${serverUrl}${SOCKET_NAMESPACES.PRESENCE}`, {
        auth: { token: tokenPair.accessToken },
        transports: ['websocket'],
        autoConnect: false,
      });

      client.connect();
      await waitForConnect(client);

      const response = await new Promise<{ error?: string }>((resolve) => {
        client.emit(CLIENT_EVENTS.SUBSCRIBE_PRESENCE, { tenantId: 'tenant-b' }, resolve);
      });

      expect(response.error).toBe('Access denied');
      
      client.disconnect();
    });
  });

  describe('Event Emission', () => {
    it('should emit to specific user', async () => {
      const userId = 'emit-user';
      const { client } = await createAuthenticatedClient('/', userId);
      
      client.connect();
      await waitForConnect(client);

      const eventPromise = waitForEvent<{ test: boolean }>(client, 'test:event');
      
      socketService.emitToUser(userId, 'test:event', { test: true });
      
      const data = await eventPromise;
      expect(data.test).toBe(true);
      
      client.disconnect();
    });

    it('should respond to ping', async () => {
      const { client } = await createAuthenticatedClient();
      
      client.connect();
      await waitForConnect(client);

      const response = await new Promise<{ pong: boolean; timestamp: number }>((resolve) => {
        client.emit(CLIENT_EVENTS.PING, resolve);
      });

      expect(response.pong).toBe(true);
      expect(response.timestamp).toBeDefined();
      
      client.disconnect();
    });
  });

  describe('Socket Metrics', () => {
    it('should record connection success', async () => {
      const { client } = await createAuthenticatedClient();
      
      client.connect();
      await waitForConnect(client);

      expect(socketMetricsService.getActiveConnections()).toBeGreaterThan(0);
      
      client.disconnect();
    });

    it('should record connection failure', async () => {
      const client = ioClient(serverUrl, {
        auth: { token: 'invalid' },
        transports: ['websocket'],
        autoConnect: false,
        timeout: 2000,
      });

      client.connect();
      
      try {
        await waitForConnect(client);
      } catch {
        // Expected to fail
      }

      const successRate = socketMetricsService.getConnectionSuccessRate();
      expect(successRate).toBeLessThan(100);
      
      client.disconnect();
    });

    it('should track disconnections', async () => {
      const { client } = await createAuthenticatedClient();
      
      client.connect();
      await waitForConnect(client);

      const initialCount = socketMetricsService.getActiveConnections();
      
      client.disconnect();
      await new Promise((r) => setTimeout(r, 100));

      expect(socketMetricsService.getActiveConnections()).toBeLessThan(initialCount);
    });
  });

  describe('Socket SLOs', () => {
    it('should check SLOs', () => {
      const sloStatus = socketMetricsService.checkSLOs();
      expect(sloStatus).toHaveProperty('met');
      expect(sloStatus).toHaveProperty('violations');
    });

    it('should get SLO status summary', () => {
      const status = socketMetricsService.getSLOStatus();
      
      expect(status).toHaveProperty('connectionSuccessRate');
      expect(status).toHaveProperty('connectionP99LatencyMs');
      expect(status).toHaveProperty('authFailuresPerMinute');
      expect(status).toHaveProperty('activeConnections');
      expect(status).toHaveProperty('slosViolated');
    });

    it('should export Prometheus format', async () => {
      const { client } = await createAuthenticatedClient();
      
      client.connect();
      await waitForConnect(client);
      client.disconnect();

      await new Promise((r) => setTimeout(r, 100));

      const prometheus = socketMetricsService.toPrometheusFormat();
      expect(typeof prometheus).toBe('string');
    });
  });

  describe('Graceful Shutdown', () => {
    it('should disconnect all clients on shutdown', async () => {
      const { client } = await createAuthenticatedClient();
      
      client.connect();
      await waitForConnect(client);
      
      expect(client.connected).toBe(true);
      
      await socketService.shutdown();
      
      await new Promise((r) => setTimeout(r, 100));
      expect(client.connected).toBe(false);
    });
  });
});

describe('Socket Model', () => {
  describe('Room Name Generators', () => {
    it('should generate tenant room name', async () => {
      const { getTenantRoom } = await import('../src/models/socket.model.js');
      expect(getTenantRoom('tenant-123')).toBe('tenant:tenant-123');
    });

    it('should generate user room name', async () => {
      const { getUserRoom } = await import('../src/models/socket.model.js');
      expect(getUserRoom('user-456')).toBe('user:user-456');
    });

    it('should generate presence room name', async () => {
      const { getPresenceRoom } = await import('../src/models/socket.model.js');
      expect(getPresenceRoom('tenant-789')).toBe('presence:tenant-789');
    });
  });

  describe('Socket Constants', () => {
    it('should define namespaces', async () => {
      const { SOCKET_NAMESPACES } = await import('../src/models/socket.model.js');
      expect(SOCKET_NAMESPACES.ROOT).toBe('/');
      expect(SOCKET_NAMESPACES.PRESENCE).toBe('/presence');
      expect(SOCKET_NAMESPACES.NOTIFICATIONS).toBe('/notifications');
    });

    it('should define SLO targets', async () => {
      const { SOCKET_SLOS } = await import('../src/models/socket.model.js');
      expect(SOCKET_SLOS.CONNECTION_LATENCY_P99_MS).toBeDefined();
      expect(SOCKET_SLOS.CONNECTION_SUCCESS_RATE).toBeDefined();
      expect(SOCKET_SLOS.AVAILABILITY_RATE).toBeDefined();
    });

    it('should define rate limits', async () => {
      const { SOCKET_RATE_LIMITS } = await import('../src/models/socket.model.js');
      expect(SOCKET_RATE_LIMITS.connection).toBeDefined();
      expect(SOCKET_RATE_LIMITS.presence).toBeDefined();
      expect(SOCKET_RATE_LIMITS.message).toBeDefined();
    });
  });
});
