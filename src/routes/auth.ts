import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RegisterSchema, LoginSchema } from '../utils/validation';
import { hashPassword, comparePassword, generateToken, generateRefreshToken } from '../utils/crypto';
import { db } from '../db';
import { logger } from '../utils/logger';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const validated = RegisterSchema.parse(req.body);

    const existing = db.connection.prepare('SELECT id FROM users WHERE email = ?').get(validated.email) as any;
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await hashPassword(validated.password);
    const userId = uuidv4();

    db.connection.prepare(`
      INSERT INTO users (id, email, password_hash, name, persona_tone)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, validated.email, passwordHash, validated.name, 'supportive');

    const accessToken = generateToken({ sub: userId, email: validated.email });
    const refreshToken = generateRefreshToken({ sub: userId });

    logger.info({ userId, email: validated.email }, 'User registered');

    res.status(201).json({
      user: { id: userId, email: validated.email, name: validated.name, persona_tone: 'supportive' },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const validated = LoginSchema.parse(req.body);

    const user = db.connection.prepare(`
      SELECT id, email, password_hash, name, persona_tone
      FROM users WHERE email = ?
    `).get(validated.email) as any;

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await comparePassword(validated.password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const accessToken = generateToken({ sub: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ sub: user.id });

    logger.info({ userId: user.id, email: user.email }, 'User logged in');

    res.json({
      user: { id: user.id, email: user.email, name: user.name, persona_tone: user.persona_tone },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const payload = require('../utils/crypto').verifyRefreshToken(refreshToken);
    const user = db.connection.prepare('SELECT id, email, name, persona_tone FROM users WHERE id = ?').get(payload.sub) as any;

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const accessToken = generateToken({ sub: user.id, email: user.email });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, persona_tone: user.persona_tone },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
