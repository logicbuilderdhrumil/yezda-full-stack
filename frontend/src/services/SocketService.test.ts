/**
 * Socket Service Tests
 * Tests for SocketService functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ConnectionStatus } from '@/@types/socket';

// Mock socket.io-client
const mockSocket = {
  id: 'test-socket-id',
  connected: false,
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  disconnect: vi.fn(),
  removeAllListeners: vi.fn(),
  io: {
    on: vi.fn(),
  },
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

// Import after mock setup
import { SocketService } from '../SocketService';

describe('SocketService', () => {
  let service: SocketService;
  let statusCallback: (status: ConnectionStatus) => void;
  let errorCallback: (error: Error) => void;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;

    statusCallback = vi.fn();
    errorCallback = vi.fn();

    service = new SocketService({
      url: 'http://localhost:3001',
      getToken: () => 'test-token',
      onStatusChange: statusCallback,
      onError: errorCallback,
    });
  });

  afterEach(() => {
    service.disconnect();
  });

  describe('initialization', () => {
    it('should start in disconnected state', () => {
      expect(service.getStatus()).toBe('disconnected');
      expect(service.isConnected()).toBe(false);
      expect(service.getSocketId()).toBeNull();
    });
  });

  describe('connect', () => {
    it('should update status to connecting when connect is called', async () => {
      await service.connect();
      expect(statusCallback).toHaveBeenCalledWith('connecting');
    });

    it('should set error status when token is not available', async () => {
      const noTokenService = new SocketService({
        url: 'http://localhost:3001',
        getToken: () => null,
        onStatusChange: statusCallback,
        onError: errorCallback,
      });

      await noTokenService.connect();
      expect(statusCallback).toHaveBeenCalledWith('error');
      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should update status to disconnected', async () => {
      await service.connect();
      service.disconnect();
      expect(statusCallback).toHaveBeenCalledWith('disconnected');
    });

    it('should reset reconnection attempts', async () => {
      await service.connect();
      service.disconnect();
      expect(service.getReconnectAttempts()).toBe(0);
    });
  });

  describe('emit', () => {
    it('should reject when not connected', async () => {
      await expect(service.emit('test:event', {})).rejects.toThrow('Socket not connected');
    });
  });

  describe('event listeners', () => {
    it('should register and return unsubscribe function', () => {
      const handler = vi.fn();
      const unsubscribe = service.on('test:event', handler);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should allow removing listener', () => {
      const handler = vi.fn();
      service.on('test:event', handler);
      service.off('test:event', handler);

      // Should not throw
    });

    it('should allow removing all listeners for an event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      service.on('test:event', handler1);
      service.on('test:event', handler2);
      service.offAll('test:event');

      // Should not throw
    });
  });
});

describe('SocketService - Types', () => {
  it('should export correct types', () => {
    // Type check - these should compile without error
    const validStatuses: ConnectionStatus[] = [
      'disconnected',
      'connecting',
      'connected',
      'reconnecting',
      'error',
    ];
    expect(validStatuses).toHaveLength(5);
  });
});
