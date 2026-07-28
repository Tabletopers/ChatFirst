import nodemailer from 'nodemailer';
import { env } from '../config';
import { logger } from '../utils/logger';

class NotifierService {
  private transporter: nodemailer.Transporter | null = null;

  initialize() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        secure: env.SMTP_SECURE || false,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });

      this.transporter.verify((error) => {
        if (error) {
          logger.warn({ error }, 'SMTP connection failed');
        } else {
          logger.info('SMTP transporter initialized successfully');
        }
      });
    } else {
      logger.warn('SMTP not configured - email notifications disabled');
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) {
      logger.warn('SMTP not configured, skipping email');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: env.SMTP_USER,
        to,
        subject,
        html,
      });
      logger.info({ to, subject }, 'Email sent successfully');
      return true;
    } catch (error) {
      logger.error({ error, to, subject }, 'Failed to send email');
      return false;
    }
  }

  async sendProactiveNotification(userEmail: string, message: string, subject: string = 'ChatFirst Check-in'): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4F46E5;">ChatFirst</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #333;">${message}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">
          You received this because you're a ChatFirst user.
          <br />
          <a href="http://localhost:5173/settings/notifications">Manage notification preferences</a>
        </p>
      </div>
    `;
    return this.sendEmail(userEmail, subject, html);
  }
}

export const notifierService = new NotifierService();
