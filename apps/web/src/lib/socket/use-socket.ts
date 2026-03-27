'use client';

import { useContext } from 'react';
import { SocketContext } from './socket-provider';
import type { Socket } from 'socket.io-client';

/**
 * Returns the Socket.io client instance from context.
 * Returns `null` when the user is not authenticated or the socket is not yet connected.
 */
export function useSocket(): Socket | null {
  return useContext(SocketContext);
}
