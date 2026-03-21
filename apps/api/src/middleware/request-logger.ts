import morgan from 'morgan';
import { createModuleLogger } from '../support/logger';

const httpLog = createModuleLogger('http');

/**
 * Morgan HTTP request logging middleware.
 * Logs method, url, status, response time, and content-length.
 */
export const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message: string) => {
        httpLog.info(message.trim());
      },
    },
  },
);
