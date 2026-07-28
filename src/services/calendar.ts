import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { logger } from '../utils/logger';

interface CalendarEvent {
  id: string;
  user_id: string;
  external_id?: string;
  title: string;
  start_time: string;
  end_time: string;
  source: string;
  metadata: Record<string, any>;
}

class CalendarService {
  async getEvents(userId: string, startDate?: string, endDate?: string): Promise<CalendarEvent[]> {
    let query = 'SELECT * FROM calendar_events WHERE user_id = ?';
    const params: any[] = [userId];

    if (startDate) {
      query += ' AND start_time >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND end_time <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY start_time ASC';

    const events = db.connection.prepare(query).all(...params) as any[];
    return events.map((e) => ({
      ...e,
      metadata: JSON.parse(e.metadata || '{}'),
    }));
  }

  async createEvent(userId: string, event: Omit<CalendarEvent, 'id' | 'user_id'>): Promise<CalendarEvent> {
    const id = uuidv4();
    const eventRow = {
      id,
      user_id: userId,
      title: event.title,
      start_time: event.start_time,
      end_time: event.end_time,
      source: event.source || 'manual',
      metadata: JSON.stringify(event.metadata || {}),
    };

    db.connection.prepare(`
      INSERT INTO calendar_events (id, user_id, title, start_time, end_time, source, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      eventRow.id,
      eventRow.user_id,
      eventRow.title,
      eventRow.start_time,
      eventRow.end_time,
      eventRow.source,
      eventRow.metadata
    );

    logger.info({ userId, eventId: id, title: event.title }, 'Calendar event created');
    return { ...eventRow, metadata: event.metadata };
  }

  async deleteEvent(userId: string, eventId: string): Promise<boolean> {
    const result = db.connection.prepare(`
      DELETE FROM calendar_events WHERE id = ? AND user_id = ?
    `).run(eventId, userId);

    if (result.changes > 0) {
      logger.info({ userId, eventId }, 'Calendar event deleted');
      return true;
    }
    return false;
  }

  async syncExternalCalendar(userId: string, events: Array<{ external_id: string; title: string; start_time: string; end_time: string }>): Promise<number> {
    let synced = 0;
    for (const event of events) {
      const existing = db.connection.prepare(`
        SELECT id FROM calendar_events WHERE user_id = ? AND external_id = ?
      `).get(userId, event.external_id);

      if (!existing) {
        await this.createEvent(userId, {
          ...event,
          source: 'google_calendar',
          metadata: { synced_at: new Date().toISOString() },
        });
        synced++;
      }
    }
    logger.info({ userId, synced }, 'External calendar sync completed');
    return synced;
  }
}

export const calendarService = new CalendarService();
