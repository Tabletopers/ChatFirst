import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { aiService } from '../services/ai';
import { db } from '../db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

router.use(authMiddleware);

router.get('/history', (req: AuthenticatedRequest, res) => {
  const { limit = 100 } = req.query as any;

  const messages = db.connection.prepare(`
    SELECT * FROM messages
    WHERE user_id = ?
    ORDER BY created_at ASC
    LIMIT ?
  `).all(req.user!.id, Number(limit)) as any[];

  const parsed = messages.map((m) => ({
    ...m,
    metadata: JSON.parse(m.metadata || '{}'),
  }));

  res.json(parsed);
});

router.post('/message', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { message, context } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const userMessageId = uuidv4();
    db.connection.prepare(`
      INSERT INTO messages (id, user_id, role, content, metadata)
      VALUES (?, ?, ?, ?, ?)
    `).run(userMessageId, req.user!.id, 'user', message, JSON.stringify(context || {}));

    const history = db.connection.prepare(`
      SELECT role, content FROM messages WHERE user_id = ? ORDER BY created_at ASC LIMIT 20
    `).all(req.user!.id) as any[];

    const messagesForAI = [
      {
        role: 'system' as const,
        content: `You are ChatFirst, a proactive AI companion and executive assistant for ${req.user!.name}. You have persistent memory of the user's preferences, goals, and commitments. Be helpful, concise, and proactive.`,
      },
      ...history.slice(-10),
    ];

    const response = await aiService.chat(messagesForAI);

    const assistantMessageId = uuidv4();
    db.connection.prepare(`
      INSERT INTO messages (id, user_id, role, content, metadata)
      VALUES (?, ?, ?, ?, ?)
    `).run(assistantMessageId, req.user!.id, 'assistant', response, JSON.stringify({ context: context || {} }));

    logger.info({ userId: req.user!.id, messageLength: message.length }, 'Chat message processed');

    res.json({
      id: assistantMessageId,
      role: 'assistant',
      content: response,
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/history', (req: AuthenticatedRequest, res) => {
  db.connection.prepare('DELETE FROM messages WHERE user_id = ?').run(req.user!.id);
  res.status(204).send();
});

export default router;
