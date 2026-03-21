import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { requestIdMiddleware } from './middleware/request-id';
import { requestLogger } from './middleware/request-logger';
import { errorHandler } from './middleware/error-handler';
import routes from './routes';

const app = express();

// Request ID for tracing
app.use(requestIdMiddleware);

// HTTP request logging
app.use(requestLogger);

// Security
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'Crochet Hub API',
    version: '0.1.0',
    status: 'running',
    docs: {
      health: '/health',
      api: '/api/v1',
      catalog: '/api/v1/catalog/products',
      categories: '/api/v1/catalog/categories',
    },
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1', routes);

// Error handling
app.use(errorHandler);

export default app;
