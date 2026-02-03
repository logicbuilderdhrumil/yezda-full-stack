/**
 * usePresence Hook
 * Task 1.7: Implement presence updates and tracking
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSocket, useSocketEvent } from '@/context/SocketContext';
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  type PresenceStatus,
  type PresenceUpdatePayload,
  type GetStatusResponse,
  type SetStatusResponse,
  type SubscribePresenceResponse,
  type UsePresenceValue,
} from '@/@types/socket';

/**
 * usePresence hook
 * Provides presence tracking and status management
 *
 * @returns Presence state and actions
 */
export function usePresence(): UsePresenceValue {
  const { emit, isConnected } = useSocket();
  const [myStatus, setMyStatus] = useState<PresenceStatus>('offline');
  const [presenceMap, setPresenceMap] = useState<Map<string, PresenceStatus>>(
    () => new Map()
  );
  const [isLoading, setIsLoading] = useState(false);
  
  // Track subscribed tenant
  const subscribedTenantRef = useRef<string | null>(null);

  // Update my status when connection changes
  useEffect(() => {
    if (isConnected) {
      setMyStatus('online');
    } else {
      setMyStatus('offline');
    }
  }, [isConnected]);

  // Handle presence update events
  useSocketEvent<PresenceUpdatePayload>(
    SERVER_EVENTS.PRESENCE_UPDATE,
    useCallback((data) => {
      setPresenceMap((prev) => {
        const next = new Map(prev);
        next.set(data.userId, data.status);
        return next;
      });
    }, []),
    isConnected
  );

  // Handle user online events
  useSocketEvent<PresenceUpdatePayload>(
    SERVER_EVENTS.USER_ONLINE,
    useCallback((data) => {
      setPresenceMap((prev) => {
        const next = new Map(prev);
        next.set(data.userId, 'online');
        return next;
      });
    }, []),
    isConnected
  );

  // Handle user offline events
  useSocketEvent<PresenceUpdatePayload>(
    SERVER_EVENTS.USER_OFFLINE,
    useCallback((data) => {
      setPresenceMap((prev) => {
        const next = new Map(prev);
        next.set(data.userId, 'offline');
        return next;
      });
    }, []),
    isConnected
  );

  /**
   * Set current user's presence status
   */
  const setStatus = useCallback(
    async (status: Exclude<PresenceStatus, 'offline'>): Promise<boolean> => {
      if (!isConnected) {
        console.warn('[usePresence] Cannot set status: not connected');
        return false;
      }

      setIsLoading(true);
      try {
        const response = await emit<SetStatusResponse>(CLIENT_EVENTS.SET_STATUS, {
          status,
        });

        if (response.success) {
          setMyStatus(status);
          return true;
        }

        console.warn('[usePresence] Set status failed:', response.error);
        return false;
      } catch (error) {
        console.error('[usePresence] Set status error:', error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [emit, isConnected]
  );

  /**
   * Get presence status for specific users
   */
  const getStatus = useCallback(
    async (userIds: string[]): Promise<Record<string, PresenceStatus>> => {
      if (!isConnected) {
        console.warn('[usePresence] Cannot get status: not connected');
        return {};
      }

      if (userIds.length === 0) {
        return {};
      }

      setIsLoading(true);
      try {
        const response = await emit<GetStatusResponse>(CLIENT_EVENTS.GET_STATUS, {
          userIds,
        });

        if (response.error) {
          console.warn('[usePresence] Get status failed:', response.error);
          return {};
        }

        // Update local presence map
        setPresenceMap((prev) => {
          const next = new Map(prev);
          for (const [userId, status] of Object.entries(response.statuses)) {
            next.set(userId, status);
          }
          return next;
        });

        return response.statuses;
      } catch (error) {
        console.error('[usePresence] Get status error:', error);
        return {};
      } finally {
        setIsLoading(false);
      }
    },
    [emit, isConnected]
  );

  /**
   * Subscribe to presence updates for a tenant
   */
  const subscribe = useCallback(
    async (tenantId?: string): Promise<boolean> => {
      if (!isConnected) {
        console.warn('[usePresence] Cannot subscribe: not connected');
        return false;
      }

      setIsLoading(true);
      try {
        const response = await emit<SubscribePresenceResponse>(
          CLIENT_EVENTS.SUBSCRIBE_PRESENCE,
          { tenantId }
        );

        if (response.success) {
          subscribedTenantRef.current = tenantId ?? null;
          return true;
        }

        console.warn('[usePresence] Subscribe failed:', response.error);
        return false;
      } catch (error) {
        console.error('[usePresence] Subscribe error:', error);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [emit, isConnected]
  );

  /**
   * Unsubscribe from presence updates
   */
  const unsubscribe = useCallback(
    (tenantId?: string): void => {
      if (!isConnected) {
        return;
      }

      emit(CLIENT_EVENTS.UNSUBSCRIBE_PRESENCE, { tenantId }).catch((error) => {
        console.warn('[usePresence] Unsubscribe error:', error);
      });

      if (tenantId === subscribedTenantRef.current || !tenantId) {
        subscribedTenantRef.current = null;
      }
    },
    [emit, isConnected]
  );

  // Clean up subscription on unmount
  useEffect(() => {
    return () => {
      if (subscribedTenantRef.current && isConnected) {
        unsubscribe(subscribedTenantRef.current);
      }
    };
  }, [unsubscribe, isConnected]);

  return {
    myStatus,
    setStatus,
    getStatus,
    subscribe,
    unsubscribe,
    presenceMap,
    isLoading,
  };
}

/**
 * useUserPresence hook
 * Convenience hook for tracking a single user's presence
 *
 * @param userId - User ID to track
 * @returns User's current presence status or 'offline' if unknown
 */
export function useUserPresence(userId: string): PresenceStatus {
  const { presenceMap, getStatus, isLoading } = usePresence();
  const [status, setStatus] = useState<PresenceStatus>('offline');
  const checkedRef = useRef(false);

  // Get initial status
  useEffect(() => {
    if (!userId || checkedRef.current || isLoading) return;

    const cached = presenceMap.get(userId);
    if (cached) {
      setStatus(cached);
      return;
    }

    checkedRef.current = true;
    getStatus([userId]).then((statuses) => {
      if (statuses[userId]) {
        setStatus(statuses[userId]);
      }
    });
  }, [userId, presenceMap, getStatus, isLoading]);

  // Update from map changes
  useEffect(() => {
    const cached = presenceMap.get(userId);
    if (cached) {
      setStatus(cached);
    }
  }, [userId, presenceMap]);

  return status;
}
