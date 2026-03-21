import { Request, Response, NextFunction } from 'express';
import { AppError } from '../modules/auth/auth.service';
import { createModuleLogger } from '../support/logger';

const log = createModuleLogger('error');

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  log.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    requestId: req.requestId,
  });

  res.status(500).json({ error: 'Internal server error' });
}
