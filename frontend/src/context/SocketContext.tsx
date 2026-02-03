/**
 * Socket Context
 * Tasks 1.3, 1.4, 1.9: SocketProvider with connection lifecycle, useSocket hook, connection status
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import type {
  ConnectionStatus,
  SocketContextValue,
  SocketNamespace,
  ClientEvent,
  ServerEvent,
} from '@/@types/socket';
import { SocketService } from '@/services/SocketService';
import { SOCKET_SERVER_URL } from '@/constants/socket.constant';

/**
 * Socket Provider Props
 */
interface SocketProviderProps {
  children: ReactNode;
  /** Socket.IO server URL - defaults to SOCKET_SERVER_URL constant */
  url?: string;
  /** Namespace to connect to */
  namespace?: SocketNamespace;
  /** Authentication token getter function */
  getToken: () => string | null | Promise<string | null>;
  /** Auto-connect on mount - defaults to true */
  autoConnect?: boolean;
}

/**
 * Socket Context - provides socket functionality to consumers
 */
const SocketContext = createContext<SocketContextValue | null>(null);

/**
 * Socket Provider
 * Wraps application parts that need socket connectivity
 */
export function SocketProvider({
  children,
  url = SOCKET_SERVER_URL,
  namespace,
  getToken,
  autoConnect = true,
}: SocketProviderProps): ReactNode {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [socketId, setSocketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const serviceRef = useRef<SocketService | null>(null);
  const getTokenRef = useRef(getToken);
  
  // Keep getToken ref up to date
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  // Initialize socket service
  useEffect(() => {
    const service = new SocketService({
      url,
      namespace,
      getToken: () => getTokenRef.current(),
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
        if (newStatus === 'connected') {
          setSocketId(service.getSocketId());
          setError(null);
        } else if (newStatus === 'disconnected') {
          setSocketId(null);
        }
      },
      onError: (err) => {
        setError(err.message);
      },
    });

    serviceRef.current = service;

    // Auto-connect if enabled
    if (autoConnect) {
      service.connect();
    }

    // Cleanup on unmount
    return () => {
      service.disconnect();
      serviceRef.current = null;
    };
  }, [url, namespace, autoConnect]);

  // Connect callback
  const connect = useCallback(() => {
    serviceRef.current?.connect();
  }, []);

  // Disconnect callback
  const disconnect = useCallback(() => {
    serviceRef.current?.disconnect();
  }, []);

  // Emit callback
  const emit = useCallback(
    <T = unknown>(event: ClientEvent | string, data?: unknown): Promise<T> => {
      if (!serviceRef.current) {
        return Promise.reject(new Error('Socket service not initialized'));
      }
      return serviceRef.current.emit<T>(event, data);
    },
    []
  );

  // Subscribe callback
  const on = useCallback(
    (event: ServerEvent | string, handler: (data: unknown) => void): (() => void) => {
      if (!serviceRef.current) {
        console.warn('[SocketProvider] Cannot subscribe, service not initialized');
        return () => {};
      }
      return serviceRef.current.on(event, handler);
    },
    []
  );

  // Unsubscribe callback
  const off = useCallback(
    (event: ServerEvent | string, handler: (data: unknown) => void): void => {
      serviceRef.current?.off(event, handler);
    },
    []
  );

  // Memoized context value
  const value = useMemo<SocketContextValue>(
    () => ({
      status,
      isConnected: status === 'connected',
      socketId,
      error,
      connect,
      disconnect,
      emit,
      on,
      off,
    }),
    [status, socketId, error, connect, disconnect, emit, on, off]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

/**
 * useSocket hook
 * Provides access to socket context from any component within SocketProvider
 * 
 * @throws Error if used outside of SocketProvider
 */
export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

/**
 * useSocketEvent hook
 * Convenience hook for subscribing to a single socket event
 * Automatically cleans up subscription on unmount
 * 
 * @param event - Event name to subscribe to
 * @param handler - Event handler callback
 * @param enabled - Whether to enable subscription (defaults to true)
 */
export function useSocketEvent<T = unknown>(
  event: ServerEvent | string,
  handler: (data: T) => void,
  enabled = true
): void {
  const { on, isConnected } = useSocket();
  const handlerRef = useRef(handler);

  // Keep handler ref up to date
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled || !isConnected) return;

    const unsubscribe = on(event, (data) => {
      handlerRef.current(data as T);
    });

    return unsubscribe;
  }, [event, on, isConnected, enabled]);
}

/**
 * useConnectionStatus hook
 * Convenience hook for accessing just the connection status
 */
export function useConnectionStatus(): {
  status: ConnectionStatus;
  isConnected: boolean;
  error: string | null;
} {
  const { status, isConnected, error } = useSocket();
  return { status, isConnected, error };
}
