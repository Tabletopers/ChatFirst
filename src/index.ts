import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config';
import { db } from './db';
import { corsMiddleware } from './middleware/cors';
import { apiLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/error';
import { authMiddleware } from './middleware/auth';
import { schedulerService } from './services/scheduler';
import { notifierService } from './services/notifier';
import { logger } from './utils/logger';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import memoryRoutes from './routes/memory';
import goalsRoutes from './routes/goals';
import accountabilityRoutes from './routes/accountability';
import calendarRoutes from './routes/calendar';
import chatRoutes from './routes/chat';
import botsRoutes from './routes/bots';
import proactiveRoutes from './routes/proactive';
import healthRoutes from './routes/health';

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(apiLimiter);

app.get('/', (_req, res) => {
  res.json({
    name: 'ChatFirst API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      users: '/api/users',
      memory: '/api/memory',
      goals: '/api/goals',
      accountability: '/api/accountability',
      calendar: '/api/calendar',
      chat: '/api/chat',
      bots: '/api/bots',
      proactive: '/api/proactive',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/accountability', accountabilityRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/bots', botsRoutes);
app.use('/api/proactive', proactiveRoutes);
app.use('/api/health', healthRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info({ port: PORT, env: env.NODE_ENV }, 'ChatFirst server started');
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    db.close();
    schedulerService.stopAll();
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    db.close();
    schedulerService.stopAll();
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled rejection');
});

process.on('uncaughtException', (error) => {
  logger.error({ error, stack: error.stack }, 'Uncaught exception');
  process.exit(1);
});

export default app;
