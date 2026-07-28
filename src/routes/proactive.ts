import { Router } from 'express';
import { db } from '../db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { aiService } from '../services/ai';
import { notifierService } from '../services/notifier';
import { logger } from '../utils/logger';

const router = Router();

router.use(authMiddleware);

router.get('/settings', (req: AuthenticatedRequest, res) => {
  const settings = db.connection.prepare(`
    SELECT * FROM users WHERE id = ?
  `).get(req.user!.id) as any;

  res.json({
    enabled: true,
    channels: ['in_app'],
    frequency: 'daily',
    quiet_hours: { start: '22:00', end: '08:00' },
  });
});

router.post('/send-checkin', async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = db.connection.prepare(`
      SELECT name, persona_tone FROM users WHERE id = ?
    `).get(req.user!.id) as any;

    const activeCommitments = db.connection.prepare(`
      SELECT description FROM commitments WHERE user_id = ? AND status = 'active' LIMIT 5
    `).all(req.user!.id) as any[];

    const activeGoals = db.connection.prepare(`
      SELECT title FROM goals WHERE user_id = ? AND status = 'active' LIMIT 5
    `).all(req.user!.id) as any[];

    const context = {
      userName: user.name,
      personaTone: user.persona_tone,
      pendingCommitments: activeCommitments.map((c: any) => c.description),
      recentActivity: 'User requested proactive check-in',
      goals: activeGoals.map((g: any) => g.title),
    };

    const message = await aiService.generateProactiveMessage(context);

    db.connection.prepare(`
      INSERT INTO notifications (id, user_id, type, title, body, data)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      crypto.randomUUID(),
      req.user!.id,
      'proactive_checkin',
      'ChatFirst Check-in',
      message,
      JSON.stringify({})
    );

    logger.info({ userId: req.user!.id }, 'Manual proactive checkin triggered');

    res.json({ message, notification: { type: 'proactive_checkin', body: message } });
  } catch (error) {
    next(error);
  }
});

router.get('/notifications', (req: AuthenticatedRequest, res) => {
  const { unread_only = false } = req.query as any;

  let query = 'SELECT * FROM notifications WHERE user_id = ?';
  const params: any[] = [req.user!.id];

  if (unread_only === 'true') {
    query += ' AND read = 0';
  }

  query += ' ORDER BY created_at DESC LIMIT 50';
  const notifications = db.connection.prepare(query).all(...params) as any[];

  res.json(notifications);
});

router.patch('/notifications/:id/read', (req: AuthenticatedRequest, res) => {
  const result = db.connection.prepare(`
    UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?
  `).run(req.params.id, req.user!.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  res.json({ message: 'Notification marked as read' });
});

export default router;
