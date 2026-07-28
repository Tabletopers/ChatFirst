import { Router } from 'express';
import { UpdatePersonaSchema } from '../utils/validation';
import { db } from '../db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

router.use(authMiddleware);

router.get('/me', (req: AuthenticatedRequest, res) => {
  const user = db.connection.prepare(`
    SELECT id, email, name, persona_tone, preferences, created_at, updated_at
    FROM users WHERE id = ?
  `).get(req.user!.id) as any;

  res.json({
    ...user,
    preferences: JSON.parse(user.preferences || '{}'),
  });
});

router.put('/persona', (req: AuthenticatedRequest, res, next) => {
  try {
    const validated = UpdatePersonaSchema.parse(req.body);

    db.connection.prepare(`
      UPDATE users SET persona_tone = ?, preferences = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(validated.persona_tone, JSON.stringify(validated.preferences || {}), req.user!.id);

    logger.info({ userId: req.user!.id, tone: validated.persona_tone }, 'Persona updated');

    res.json({ message: 'Persona updated successfully', persona_tone: validated.persona_tone });
  } catch (error) {
    next(error);
  }
});

export default router;
