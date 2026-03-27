'use client';

import { createContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/lib/stores/auth-store';

/** Context value — socket instance or null when disconnected */
export const SocketContext = createContext<Socket | null>(null);

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000';

/**
 * Provides a Socket.io client connection to the component tree.
 *
 * - Connects when the user is authenticated (watches the auth store).
 * - Disconnects when the user logs out.
 * - Passes the JWT token in the handshake `auth` payload.
 * - Auto-reconnects on disconnect (socket.io default behavior).
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only connect when the user is authenticated and has a token
    if (!isAuthenticated || !accessToken) {
      // Disconnect any existing socket on logout
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    // Create a new socket connection with auth token
    const newSocket = io(SOCKET_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Optional: log connection status in development
    if (process.env.NODE_ENV === 'development') {
      newSocket.on('connect', () => {
        console.log('[Socket] Connected:', newSocket.id);
      });
      newSocket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
      });
      newSocket.on('connect_error', (err) => {
        console.error('[Socket] Connection error:', err.message);
      });
    }

    // Cleanup: disconnect when auth changes or component unmounts
    return () => {
      newSocket.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [isAuthenticated, accessToken]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}
