import cron from 'node-cron';
import { db } from '../db';
import { aiService } from './ai';
import { logger } from '../utils/logger';

interface ScheduledJob {
  name: string;
  task: cron.ScheduledTask;
}

class SchedulerService {
  private jobs: Map<string, ScheduledJob> = new Map();

  start() {
    logger.info('Starting proactive messaging scheduler');

    cron.schedule('0 8 * * *', async () => {
      await this.processProactiveCheckins('morning');
    }, { name: 'morning_checkin' });

    cron.schedule('0 12 * * *', async () => {
      await this.processProactiveCheckins('midday');
    }, { name: 'midday_checkin' });

    cron.schedule('0 18 * * *', async () => {
      await this.processProactiveCheckins('evening');
    }, { name: 'evening_checkin' });

    cron.schedule('0 21 * * *', async () => {
      await this.processDeadlineReminders();
    }, { name: 'deadline_reminder' });

    logger.info('Scheduler started successfully');
  }

  private async processProactiveCheckins(timeOfDay: string) {
    try {
      const activeCommitments = db.connection.prepare(`
        SELECT c.*, u.name as user_name, u.persona_tone, g.title as goal_title
        FROM commitments c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN goals g ON c.goal_id = g.id
        WHERE c.status = 'active'
        AND c.next_checkin <= datetime('now')
        AND c.frequency = ?
      `).all(timeOfDay === 'morning' ? 'daily' : 'custom') as any[];

      logger.info({ count: activeCommitments.length, timeOfDay }, 'Processing proactive checkins');

      for (const commitment of activeCommitments) {
        try {
          const context = {
            userName: commitment.user_name,
            personaTone: commitment.persona_tone,
            pendingCommitments: [commitment.description],
            recentActivity: 'No recent check-ins',
            goals: commitment.goal_title ? [commitment.goal_title] : [],
          };

          const message = await aiService.generateProactiveMessage(context);

          db.connection.prepare(`
            INSERT INTO notifications (id, user_id, type, title, body, data)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            crypto.randomUUID(),
            commitment.user_id,
            'proactive_checkin',
            timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1) + ' Check-in',
            message,
            JSON.stringify({ commitment_id: commitment.id })
          );

          db.connection.prepare(`
            UPDATE commitments
            SET next_checkin = datetime('now', '+1 day')
            WHERE id = ?
          `).run(commitment.id);

          logger.info({ userId: commitment.user_id, commitmentId: commitment.id }, 'Proactive checkin sent');
        } catch (error) {
          logger.error({ error, commitmentId: commitment.id }, 'Failed to send proactive checkin');
        }
      }
    } catch (error) {
      logger.error({ error }, 'Failed to process proactive checkins');
    }
  }

  private async processDeadlineReminders() {
    try {
      const upcomingDeadlines = db.connection.prepare(`
        SELECT g.*, u.name as user_name, u.persona_tone
        FROM goals g
        JOIN users u ON g.user_id = u.id
        WHERE g.status = 'active'
        AND g.deadline IS NOT NULL
        AND g.deadline <= datetime('now', '+3 days')
        AND g.deadline >= datetime('now')
      `).all() as any[];

      logger.info({ count: upcomingDeadlines.length }, 'Processing deadline reminders');

      for (const goal of upcomingDeadlines) {
        try {
          const context = {
            userName: goal.user_name,
            personaTone: goal.persona_tone,
            pendingCommitments: [],
            recentActivity: 'Working on goals',
            goals: [goal.title],
          };

          const message = await aiService.generateProactiveMessage(context);

          db.connection.prepare(`
            INSERT INTO notifications (id, user_id, type, title, body, data)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(
            crypto.randomUUID(),
            goal.user_id,
            'deadline_reminder',
            'Goal Deadline Approaching',
            `Reminder: "${goal.title}" is due ${goal.deadline}. ${message}`,
            JSON.stringify({ goal_id: goal.id })
          );

          logger.info({ userId: goal.user_id, goalId: goal.id }, 'Deadline reminder sent');
        } catch (error) {
          logger.error({ error, goalId: goal.id }, 'Failed to send deadline reminder');
        }
      }
    } catch (error) {
      logger.error({ error }, 'Failed to process deadline reminders');
    }
  }

  addJob(name: string, cronExpression: string, task: () => void) {
    if (this.jobs.has(name)) {
      logger.warn({ name }, 'Job already exists');
      return;
    }
    const scheduledTask = cron.schedule(cronExpression, task, { name });
    this.jobs.set(name, { name, task: scheduledTask });
    logger.info({ name, cronExpression }, 'Job added');
  }

  removeJob(name: string) {
    const job = this.jobs.get(name);
    if (job) {
      job.task.stop();
      this.jobs.delete(name);
      logger.info({ name }, 'Job removed');
    }
  }

  stopAll() {
    for (const [name, job] of this.jobs) {
      job.task.stop();
      logger.info({ name }, 'Job stopped');
    }
    this.jobs.clear();
  }
}

export const schedulerService = new SchedulerService();
