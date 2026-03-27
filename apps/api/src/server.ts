import 'dotenv/config';
import http from 'http';
import app from './app';
import { env } from './config/env';
import { createModuleLogger } from './support/logger';
import { initSocket } from './socket/socket';
import { initializeJobs, shutdownJobs } from './jobs';
import { isRedisAvailable } from './config/redis';

const log = createModuleLogger('server');
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(env.API_PORT, async () => {
  log.info(`Server running on http://localhost:${env.API_PORT}`);
  log.info(`Environment: ${env.NODE_ENV}`);
  log.info(`Socket.io ready for connections`);

  // Initialize BullMQ job queues (only if Redis is available).
  // Jobs are optional — the app works fine without them.
  if (isRedisAvailable()) {
    await initializeJobs();
  } else {
    log.warn('Redis unavailable at startup — job queues not initialized');
  }
});

// Graceful shutdown: close workers before exiting
process.on('SIGTERM', async () => {
  log.info('SIGTERM received — shutting down gracefully');
  await shutdownJobs();
  server.close();
});

process.on('SIGINT', async () => {
  log.info('SIGINT received — shutting down gracefully');
  await shutdownJobs();
  server.close();
});

export default server;
