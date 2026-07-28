import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CreateBotGroupSchema, AddBotToGroupSchema } from '../utils/validation';
import { aiService } from '../services/ai';
import { db } from '../db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

router.use(authMiddleware);

router.get('/groups', (req: AuthenticatedRequest, res) => {
  const groups = db.connection.prepare(`
    SELECT g.*, COUNT(bgm.id) as member_count
    FROM bot_groups g
    LEFT JOIN bot_group_members bgm ON g.id = bgm.group_id
    WHERE g.id IN (
      SELECT group_id FROM bot_group_members WHERE user_id = ?
    )
    GROUP BY g.id
    ORDER BY g.created_at DESC
  `).all(req.user!.id) as any[];

  res.json(groups);
});

router.post('/groups', (req: AuthenticatedRequest, res, next) => {
  try {
    const validated = CreateBotGroupSchema.parse(req.body);
    const id = uuidv4();

    db.connection.prepare(`
      INSERT INTO bot_groups (id, name, description)
      VALUES (?, ?, ?)
    `).run(id, validated.name, validated.description);

    db.connection.prepare(`
      INSERT INTO bot_group_members (id, group_id, bot_id, user_id, bot_name, bot_persona, capabilities)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), id, 'chatfirst-main', req.user!.id, 'ChatFirst', 'supportive', JSON.stringify(['chat', 'memory', 'accountability']));

    logger.info({ userId: req.user!.id, groupId: id, name: validated.name }, 'Bot group created');

    res.status(201).json({
      id,
      name: validated.name,
      description: validated.description,
      member_count: 1,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/groups/:groupId/bots', (req: AuthenticatedRequest, res, next) => {
  try {
    const validated = AddBotToGroupSchema.parse(req.body);
    const group = db.connection.prepare('SELECT id FROM bot_groups WHERE id = ?').get(req.params.groupId) as any;
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const id = uuidv4();
    db.connection.prepare(`
      INSERT INTO bot_group_members (id, group_id, bot_id, user_id, bot_name, bot_persona, capabilities)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, validated.group_id, validated.bot_id, req.user!.id, validated.bot_name, validated.bot_persona, JSON.stringify(validated.capabilities));

    logger.info({ userId: req.user!.id, groupId: validated.group_id, botId: validated.bot_id }, 'Bot added to group');

    res.status(201).json({
      id,
      group_id: validated.group_id,
      bot_id: validated.bot_id,
      bot_name: validated.bot_name,
      bot_persona: validated.bot_persona,
      capabilities: validated.capabilities,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/groups/:groupId/messages', (req: AuthenticatedRequest, res) => {
  const { limit = 50 } = req.query as any;

  const group = db.connection.prepare(`
    SELECT id FROM bot_groups WHERE id = ? AND id IN (
      SELECT group_id FROM bot_group_members WHERE user_id = ?
    )
  `).get(req.params.groupId, req.user!.id) as any;

  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }

  const messages = db.connection.prepare(`
    SELECT * FROM bot_messages
    WHERE group_id = ?
    ORDER BY created_at ASC
    LIMIT ?
  `).all(req.params.groupId, Number(limit)) as any[];

  const parsed = messages.map((m) => ({
    ...m,
    metadata: JSON.parse(m.metadata || '{}'),
  }));

  res.json(parsed);
});

router.post('/groups/:groupId/messages', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { message } = req.body;
    const group = db.connection.prepare(`
      SELECT id FROM bot_groups WHERE id = ? AND id IN (
        SELECT group_id FROM bot_group_members WHERE user_id = ?
      )
    `).get(req.params.groupId, req.user!.id) as any;

    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }

    const botMembers = db.connection.prepare(`
      SELECT bot_id, bot_name, bot_persona, capabilities
      FROM bot_group_members
      WHERE group_id = ?
    `).all(req.params.groupId) as any[];

    const contextMessages = [
      {
        role: 'system' as const,
        content: `You are ${botMembers[0]?.bot_name || 'a bot'} in a multi-bot group chat. You are collaborating with other bots. Be concise and helpful. The user said: ${message}`,
      },
    ];

    const responses: any[] = [];
    for (const bot of botMembers) {
      const botResponse = await aiService.chat([
        { role: 'system', content: `You are ${bot.bot_name}, a ${bot.bot_persona} bot. You are in a group chat with other bots. Respond to the message: ${message}` },
        { role: 'user', content: message },
      ], { maxTokens: 200 });

      const msgId = uuidv4();
      db.connection.prepare(`
        INSERT INTO bot_messages (id, group_id, bot_id, content, metadata)
        VALUES (?, ?, ?, ?, ?)
      `).run(msgId, req.params.groupId, bot.bot_id, botResponse, JSON.stringify({ bot_name: bot.bot_name }));

      responses.push({
        id: msgId,
        group_id: req.params.groupId,
        bot_id: bot.bot_id,
        content: botResponse,
        metadata: { bot_name: bot.bot_name },
        created_at: new Date().toISOString(),
      });
    }

    res.status(201).json(responses);
  } catch (error) {
    next(error);
  }
});

export default router;
