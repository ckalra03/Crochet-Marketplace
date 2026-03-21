import 'dotenv/config';
import http from 'http';
import app from './app';
import { env } from './config/env';
import { createModuleLogger } from './support/logger';
import { initSocket } from './socket/socket';

const log = createModuleLogger('server');
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

server.listen(env.API_PORT, () => {
  log.info(`Server running on http://localhost:${env.API_PORT}`);
  log.info(`Environment: ${env.NODE_ENV}`);
  log.info(`Socket.io ready for connections`);
});

export default server;
