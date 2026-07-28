import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CreateMemorySchema } from '../utils/validation';
import { db } from '../db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

router.use(authMiddleware);

router.get('/', (req: AuthenticatedRequest, res) => {
  const { category, limit = 50, offset = 0, search } = req.query as any;

  let query = 'SELECT * FROM memories WHERE user_id = ?';
  const params: any[] = [req.user!.id];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND content LIKE ?';
    params.push(`%${search}%`);
  }

  query += ' ORDER BY importance DESC, created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const memories = db.connection.prepare(query).all(...params) as any[];
  const parsed = memories.map((m) => ({
    ...m,
    metadata: JSON.parse(m.metadata || '{}'),
  }));

  res.json(parsed);
});

router.post('/', (req: AuthenticatedRequest, res, next) => {
  try {
    const validated = CreateMemorySchema.parse(req.body);
    const id = uuidv4();

    db.connection.prepare(`
      INSERT INTO memories (id, user_id, content, category, importance)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, req.user!.id, validated.content, validated.category, validated.importance);

    logger.info({ userId: req.user!.id, memoryId: id, category: validated.category }, 'Memory created');

    res.status(201).json({
      id,
      user_id: req.user!.id,
      content: validated.content,
      category: validated.category,
      importance: validated.importance,
      metadata: {},
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', (req: AuthenticatedRequest, res) => {
  const result = db.connection.prepare(`
    DELETE FROM memories WHERE id = ? AND user_id = ?
  `).run(req.params.id, req.user!.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Memory not found' });
  }

  res.status(204).send();
});

export default router;
