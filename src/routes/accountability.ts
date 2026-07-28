import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CreateCommitmentSchema, CreateCheckinSchema } from '../utils/validation';
import { db } from '../db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

router.use(authMiddleware);

router.get('/commitments', (req: AuthenticatedRequest, res) => {
  const { status = 'active', goal_id } = req.query as any;

  let query = `
    SELECT c.*, g.title as goal_title, g.category as goal_category
    FROM commitments c
    LEFT JOIN goals g ON c.goal_id = g.id
    WHERE c.user_id = ?
  `;
  const params: any[] = [req.user!.id];

  if (status) {
    query += ' AND c.status = ?';
    params.push(status);
  }
  if (goal_id) {
    query += ' AND c.goal_id = ?';
    params.push(goal_id);
  }

  query += ' ORDER BY c.streak DESC, c.created_at DESC';

  const commitments = db.connection.prepare(query).all(...params) as any[];
  res.json(commitments);
});

router.post('/commitments', (req: AuthenticatedRequest, res, next) => {
  try {
    const validated = CreateCommitmentSchema.parse(req.body);
    const id = uuidv4();

    const now = new Date().toISOString();
    let nextCheckin: string;
    switch (validated.frequency) {
      case 'daily':
        nextCheckin = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'weekly':
        nextCheckin = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        nextCheckin = now;
    }

    db.connection.prepare(`
      INSERT INTO commitments (id, user_id, goal_id, description, frequency, next_checkin)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, req.user!.id, validated.goal_id, validated.description, validated.frequency, nextCheckin);

    logger.info({ userId: req.user!.id, commitmentId: id }, 'Commitment created');

    const commitment = db.connection.prepare('SELECT * FROM commitments WHERE id = ?').get(id) as any;
    res.status(201).json(commitment);
  } catch (error) {
    next(error);
  }
});

router.post('/checkins', (req: AuthenticatedRequest, res, next) => {
  try {
    const validated = CreateCheckinSchema.parse(req.body);

    const commitment = db.connection.prepare(`
      SELECT * FROM commitments WHERE id = ? AND user_id = ?
    `).get(validated.commitment_id, req.user!.id) as any;

    if (!commitment) {
      return res.status(404).json({ error: 'Commitment not found' });
    }

    const checkinId = uuidv4();
    const now = new Date().toISOString();
    let streak = commitment.streak || 0;

    if (validated.completed) {
      streak += 1;
      db.connection.prepare(`
        UPDATE commitments
        SET streak = ?, last_checkin = ?, next_checkin = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(streak, now, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), validated.commitment_id);
    } else {
      streak = 0;
      db.connection.prepare(`
        UPDATE commitments
        SET streak = ?, next_checkin = datetime('now', '+1 day'), updated_at = datetime('now')
        WHERE id = ?
      `).run(streak, validated.commitment_id);
    }

    db.connection.prepare(`
      INSERT INTO checkins (id, commitment_id, user_id, note, completed)
      VALUES (?, ?, ?, ?, ?)
    `).run(checkinId, validated.commitment_id, req.user!.id, validated.note, validated.completed ? 1 : 0);

    logger.info({ userId: req.user!.id, commitmentId: validated.commitment_id, completed: validated.completed, streak }, 'Check-in recorded');

    res.status(201).json({
      id: checkinId,
      commitment_id: validated.commitment_id,
      completed: validated.completed,
      streak,
      created_at: now,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/checkins', (req: AuthenticatedRequest, res) => {
  const { commitment_id, limit = 50 } = req.query as any;

  let query = 'SELECT * FROM checkins WHERE user_id = ?';
  const params: any[] = [req.user!.id];

  if (commitment_id) {
    query += ' AND commitment_id = ?';
    params.push(commitment_id);
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(Number(limit));

  const checkins = db.connection.prepare(query).all(...params) as any[];
  res.json(checkins);
});

router.get('/stats', (req: AuthenticatedRequest, res) => {
  const totalCommitments = db.connection.prepare(`
    SELECT COUNT(*) as count FROM commitments WHERE user_id = ? AND status = 'active'
  `).get(req.user!.id) as any;

  const completedCheckins = db.connection.prepare(`
    SELECT COUNT(*) as count FROM checkins WHERE user_id = ? AND completed = 1
  `).get(req.user!.id) as any;

  const currentStreak = db.connection.prepare(`
    SELECT MAX(streak) as streak FROM commitments WHERE user_id = ?
  `).get(req.user!.id) as any;

  res.json({
    activeCommitments: totalCommitments.count,
    totalCompleted: completedCheckins.count,
    bestStreak: currentStreak.streak || 0,
  });
});

export default router;
