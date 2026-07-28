import pino from 'pino';
import pinoPretty from 'pino-pretty';
import { env } from '../config';

const isDevelopment = env.NODE_ENV === 'development';

const logger = pino(
  {
    level: env.LOG_LEVEL,
    formatters: isDevelopment
      ? undefined
      : {
          log: (obj: any) => {
            const { time, level, msg, pid, hostname } = obj;
            const logObject: Record<string, any> = {
              time,
              level: pino.levels.labels[level] || level,
              msg,
              pid,
              hostname,
            };
            if (obj.error) logObject.error = obj.error;
            return logObject;
          },
        },
  },
  isDevelopment ? pinoPretty({ translateTime: 'SYS:yyyy-mm-dd HH:MM:ss', colorize: true }) : undefined
);

export { logger };
