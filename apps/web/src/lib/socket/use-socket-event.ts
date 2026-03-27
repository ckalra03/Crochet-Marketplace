'use client';

import { useEffect } from 'react';
import { useSocket } from './use-socket';

/**
 * Subscribes to a Socket.io event with automatic cleanup on unmount.
 *
 * @param eventName - The socket event to listen to
 * @param callback  - Handler called with the event payload
 */
export function useSocketEvent<T = unknown>(
  eventName: string,
  callback: (data: T) => void,
): void {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    // Subscribe to the event
    socket.on(eventName, callback);

    // Cleanup: unsubscribe when the component unmounts or deps change
    return () => {
      socket.off(eventName, callback);
    };
  }, [socket, eventName, callback]);
}
