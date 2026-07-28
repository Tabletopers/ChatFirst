import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/crypto';
import { db } from '../db';
import { logger } from '../utils/logger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyToken(token);
    const user = db.connection.prepare('SELECT id, email, name FROM users WHERE id = ?').get(payload.sub) as { id: string; email: string; name: string } | undefined;
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const payload = verifyToken(token);
      const user = db.connection.prepare('SELECT id, email, name FROM users WHERE id = ?').get(payload.sub) as { id: string; email: string; name: string } | undefined;
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Ignore invalid tokens for optional auth
    }
  }
  next();
}
