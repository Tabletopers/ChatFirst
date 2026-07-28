import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config';
import { logger } from './logger';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: object): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRY } as any);
}

export function generateRefreshToken(payload: object): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRY } as any);
}

export function verifyToken(token: string): jwt.JwtPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  } catch (error) {
    logger.warn({ error }, 'Token verification failed');
    throw new Error('Invalid token');
  }
}

export function verifyRefreshToken(token: string): jwt.JwtPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
  } catch (error) {
    logger.warn({ error }, 'Refresh token verification failed');
    throw new Error('Invalid refresh token');
  }
}
