import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { verifyAccessToken } from '../modules/auth/jwt.service';
import { createModuleLogger } from '../support/logger';
import { env } from '../config/env';

const log = createModuleLogger('socket');

let io: SocketServer;

export function initSocket(server: HttpServer): SocketServer {
  io = new SocketServer(server, {
    cors: {
      origin: env.CORS_ORIGIN.includes(',') ? env.CORS_ORIGIN.split(',').map((o) => o.trim()) : env.CORS_ORIGIN,
      credentials: true,
    },
  });

  // JWT auth middleware for Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, role, sellerProfileId } = socket.data.user;

    // Join personal room
    socket.join(`user:${userId}`);

    // Join role-based rooms
    if (role === 'SELLER' && sellerProfileId) {
      socket.join(`seller:${sellerProfileId}`);
    }
    if (role === 'ADMIN') {
      socket.join('admin');
    }

    log.debug(`Socket connected: ${userId} (${role})`, { socketId: socket.id });

    socket.on('disconnect', () => {
      log.debug(`Socket disconnected: ${userId}`, { socketId: socket.id });
    });
  });

  log.info('Socket.io initialized');
  return io;
}

export function getIO(): SocketServer {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}

/**
 * Emit event to a specific user
 */
export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
}

/**
 * Emit event to a specific seller
 */
export function emitToSeller(sellerProfileId: string, event: string, data: any) {
  if (io) {
    io.to(`seller:${sellerProfileId}`).emit(event, data);
  }
}

/**
 * Emit event to all admins
 */
export function emitToAdmins(event: string, data: any) {
  if (io) {
    io.to('admin').emit(event, data);
  }
}
