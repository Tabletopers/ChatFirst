import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { env } from '../config';
import { logger } from '../utils/logger';

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error({ error: error.message, stack: error.stack, url: req.url, method: req.method });

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token' });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired' });
  }

  return res.status(500).json({
    error: env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
  });
}
