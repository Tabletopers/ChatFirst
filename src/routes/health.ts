import { Router } from 'express';
import { db } from '../db';
import { logger } from '../utils/logger';

const router = Router();

router.get('/health', (_req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: 'connected',
    version: '1.0.0',
  };

  try {
    db.connection.prepare('SELECT 1').get();
    res.json(health);
  } catch (error) {
    logger.error({ error }, 'Health check database error');
    health.status = 'unhealthy';
    health.database = 'error';
    res.status(503).json(health);
  }
});

router.get('/ready', (_req, res) => {
  res.json({ ready: true });
});

router.get('/metrics', (_req, res) => {
  const userCount = db.connection.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  const goalCount = db.connection.prepare('SELECT COUNT(*) as count FROM goals').get() as any;
  const commitmentCount = db.connection.prepare('SELECT COUNT(*) as count FROM commitments').get() as any;
  const memoryCount = db.connection.prepare('SELECT COUNT(*) as count FROM memories').get() as any;

  res.json({
    users: userCount.count,
    goals: goalCount.count,
    commitments: commitmentCount.count,
    memories: memoryCount.count,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

export default router;
