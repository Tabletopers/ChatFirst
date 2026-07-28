import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CreateGoalSchema } from '../utils/validation';
import { db } from '../db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

router.use(authMiddleware);

router.get('/', (req: AuthenticatedRequest, res) => {
  const { status = 'active', category } = req.query as any;

  let query = 'SELECT * FROM goals WHERE user_id = ?';
  const params: any[] = [req.user!.id];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY priority DESC, created_at DESC';

  const goals = db.connection.prepare(query).all(...params) as any[];
  res.json(goals);
});

router.post('/', (req: AuthenticatedRequest, res, next) => {
  try {
    const validated = CreateGoalSchema.parse(req.body);
    const id = uuidv4();

    db.connection.prepare(`
      INSERT INTO goals (id, user_id, title, description, deadline, priority, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.user!.id, validated.title, validated.description, validated.deadline, validated.priority, validated.category);

    logger.info({ userId: req.user!.id, goalId: id, title: validated.title }, 'Goal created');

    const goal = db.connection.prepare('SELECT * FROM goals WHERE id = ?').get(id) as any;
    res.status(201).json(goal);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', (req: AuthenticatedRequest, res, next) => {
  try {
    const goal = db.connection.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(req.params.id, req.user!.id) as any;
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const { status, progress, title, description, deadline, priority, category } = req.body;

    db.connection.prepare(`
      UPDATE goals SET
        status = COALESCE(?, status),
        progress = COALESCE(?, progress),
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        deadline = COALESCE(?, deadline),
        priority = COALESCE(?, priority),
        category = COALESCE(?, category),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(status, progress, title, description, deadline, priority, category, req.params.id);

    const updated = db.connection.prepare('SELECT * FROM goals WHERE id = ?').get(req.params.id) as any;
    logger.info({ userId: req.user!.id, goalId: req.params.id }, 'Goal updated');
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', (req: AuthenticatedRequest, res) => {
  const result = db.connection.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?').run(req.params.id, req.user!.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Goal not found' });
  }
  res.status(204).send();
});

export default router;
