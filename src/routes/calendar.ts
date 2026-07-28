import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { calendarService } from '../services/calendar';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

router.use(authMiddleware);

router.get('/events', async (req: AuthenticatedRequest, res) => {
  try {
    const { start, end } = req.query as any;
    const events = await calendarService.getEvents(req.user!.id, start, end);
    res.json(events);
  } catch (error) {
    logger.error({ error, userId: req.user!.id }, 'Failed to fetch calendar events');
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

router.post('/events', async (req: AuthenticatedRequest, res) => {
  try {
    const { title, start_time, end_time, metadata } = req.body;
    const event = await calendarService.createEvent(req.user!.id, {
      title,
      start_time,
      end_time,
      source: 'manual',
      metadata: metadata || {},
    });
    res.status(201).json(event);
  } catch (error) {
    logger.error({ error, userId: req.user!.id }, 'Failed to create calendar event');
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
});

router.delete('/events/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const deleted = await calendarService.deleteEvent(req.user!.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error({ error, userId: req.user!.id }, 'Failed to delete calendar event');
    res.status(500).json({ error: 'Failed to delete calendar event' });
  }
});

router.post('/sync', async (req: AuthenticatedRequest, res) => {
  try {
    const { events } = req.body;
    const synced = await calendarService.syncExternalCalendar(req.user!.id, events);
    res.json({ synced });
  } catch (error) {
    logger.error({ error, userId: req.user!.id }, 'Failed to sync calendar');
    res.status(500).json({ error: 'Failed to sync calendar' });
  }
});

export default router;
