import 'dotenv/config';
import http from 'http';
import app from './app';
import { env } from './config/env';

const server = http.createServer(app);

server.listen(env.API_PORT, () => {
  console.log(`[api] Server running on http://localhost:${env.API_PORT}`);
  console.log(`[api] Environment: ${env.NODE_ENV}`);
});

export default server;
