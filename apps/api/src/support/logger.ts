import winston from 'winston';
import path from 'path';
import { env } from '../config/env';

const logDir = env.LOG_DIR;

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, module, ...meta }) => {
    const mod = module ? `[${module}]` : '';
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level} ${mod} ${message}${metaStr}`;
  }),
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// File transports only in non-test environments
if (env.NODE_ENV !== 'test') {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      format: logFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  );
}

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: { service: 'crochet-hub-api' },
  transports,
});

/**
 * Create a child logger with a module name for context.
 * Usage: const log = createModuleLogger('auth');
 */
export function createModuleLogger(module: string) {
  return logger.child({ module });
}
