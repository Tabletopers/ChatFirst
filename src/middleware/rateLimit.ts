import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config';
import { logger } from '../utils/logger';

export const apiLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
  },
  handler: (req, res) => {
    logger.warn({ ip: req.ip, url: req.url }, 'Rate limit exceeded');
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  handler: (req, res) => {
    logger.warn({ ip: req.ip, url: req.url }, 'Auth rate limit exceeded');
    res.status(429).json({ error: 'Too many authentication attempts, please try again later.' });
  },
});
