/**
 * Socket Service
 * Tasks 1.5, 1.6, 1.8: Implement emitters, listeners, reconnect and error handling
 */

import { io, Socket } from 'socket.io-client';
import type {
  ConnectionStatus,
  SocketNamespace,
  ClientEvent,
  ServerEvent,
} from '@/@types/socket';
import {
  SOCKET_SERVER_URL,
  DEFAULT_SOCKET_OPTIONS,
  PING_INTERVAL,
} from '@/constants/socket.constant';

/**
 * Event listener callback type
 */
type EventListener = (data: unknown) => void;

/**
 * Socket connection configuration
 */
interface SocketConfig {
  /** Server URL */
  url?: string | undefined;
  /** Namespace to connect to */
  namespace?: SocketNamespace | undefined;
  /** Authentication token getter */
  getToken: () => string | null | Promise<string | null>;
  /** Callback for connection status changes */
  onStatusChange?: ((status: ConnectionStatus) => void) | undefined;
  /** Callback for errors */
  onError?: ((error: Error) => void) | undefined;
}

/**
 * Socket Service Class
 * Manages Socket.IO client connection, events, and reconnection
 */
export class SocketService {
  private socket: Socket | null = null;
  private config: SocketConfig;
  private status: ConnectionStatus = 'disconnected';
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Map<string, Set<EventListener>> = new Map();
  private reconnectAttempts = 0;

  constructor(config: SocketConfig) {
    this.config = config;
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Get socket ID when connected
   */
  getSocketId(): string | null {
    return this.socket?.id ?? null;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === 'connected' && this.socket?.connected === true;
  }

  /**
   * Connect to the socket server
   */
  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    this.setStatus('connecting');

    try {
      const token = await this.config.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const url = this.config.url || SOCKET_SERVER_URL;
      const namespace = this.config.namespace || '/';
      const fullUrl = namespace === '/' ? url : `${url}${namespace}`;

      this.socket = io(fullUrl, {
        ...DEFAULT_SOCKET_OPTIONS,
        transports: [...DEFAULT_SOCKET_OPTIONS.transports],
        auth: { token },
        autoConnect: true,
      });

      this.setupEventHandlers();
    } catch (error) {
      this.setStatus('error');
      this.config.onError?.(error as Error);
    }
  }

  /**
   * Disconnect from the socket server
   */
  disconnect(): void {
    this.stopPingInterval();
    
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.setStatus('disconnected');
    this.reconnectAttempts = 0;
  }

  /**
   * Emit an event to the server
   * Returns a promise that resolves with the server's response
   */
  emit<T = unknown>(event: ClientEvent | string, data?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      let settled = false;
      const timeoutId = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error(`Emit timeout for event: ${event}`));
        }
      }, 10000);

      // Use acknowledgment callback for response
      this.socket.emit(event, data, (response: T) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          resolve(response);
        }
      });
    });
  }

  /**
   * Emit without waiting for response
   */
  emitNoAck(event: ClientEvent | string, data?: unknown): void {
    if (!this.socket?.connected) {
      console.warn('[SocketService] Cannot emit, socket not connected');
      return;
    }
    this.socket.emit(event, data);
  }

  /**
   * Subscribe to server events
   * Returns unsubscribe function
   */
  on(event: ServerEvent | string, handler: EventListener): () => void {
    // Track in local listener map
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);

    // Attach to socket if connected
    this.socket?.on(event, handler);

    // Return unsubscribe function
    return () => {
      this.off(event, handler);
    };
  }

  /**
   * Unsubscribe from server events
   */
  off(event: ServerEvent | string, handler: EventListener): void {
    this.socket?.off(event, handler);
    this.listeners.get(event)?.delete(handler);
  }

  /**
   * Remove all listeners for an event
   */
  offAll(event: ServerEvent | string): void {
    this.socket?.off(event);
    this.listeners.delete(event);
  }

  /**
   * Set up socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Connection established
    this.socket.on('connect', () => {
      console.log('[SocketService] Connected:', this.socket?.id);
      this.setStatus('connected');
      this.reconnectAttempts = 0;
      this.startPingInterval();
      
      // Re-attach all tracked listeners
      for (const [event, handlers] of this.listeners) {
        for (const handler of handlers) {
          this.socket?.on(event, handler);
        }
      }
    });

    // Connection error
    this.socket.on('connect_error', (error: Error) => {
      console.error('[SocketService] Connection error:', error.message);
      this.setStatus('error');
      this.config.onError?.(error);
    });

    // Disconnected
    this.socket.on('disconnect', (reason: string) => {
      console.log('[SocketService] Disconnected:', reason);
      this.stopPingInterval();

      if (reason === 'io server disconnect') {
        // Server initiated disconnect, don't auto-reconnect
        this.setStatus('disconnected');
      } else {
        // Client-side disconnect or network issue
        this.setStatus('reconnecting');
      }
    });

    // Reconnection attempt
    this.socket.io.on('reconnect_attempt', (attempt: number) => {
      console.log('[SocketService] Reconnection attempt:', attempt);
      this.reconnectAttempts = attempt;
      this.setStatus('reconnecting');
    });

    // Reconnection successful
    this.socket.io.on('reconnect', (attempt: number) => {
      console.log('[SocketService] Reconnected after', attempt, 'attempts');
      this.setStatus('connected');
      this.reconnectAttempts = 0;
    });

    // Reconnection failed
    this.socket.io.on('reconnect_failed', () => {
      console.error('[SocketService] Reconnection failed');
      this.setStatus('error');
      this.config.onError?.(new Error('Reconnection failed'));
    });
  }

  /**
   * Start keepalive ping interval
   */
  private startPingInterval(): void {
    this.stopPingInterval();
    
    this.pingInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping', (response: { pong: boolean; timestamp: number }) => {
          if (response?.pong) {
            // Connection is alive
          }
        });
      }
    }, PING_INTERVAL);
  }

  /**
   * Stop keepalive ping interval
   */
  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Update connection status
   */
  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.config.onStatusChange?.(status);
    }
  }

  /**
   * Get reconnection attempts count
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}
