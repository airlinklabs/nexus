import pino from 'pino';
import { env } from './env.js';

const loggerOptions =
  env.NODE_ENV === 'development'
    ? {
        level: 'debug' as const,
        transport: { target: 'pino-pretty', options: { colorize: true } },
      }
    : { level: 'info' as const };

export const logger = pino(loggerOptions);

export const botLogger = logger.child({ module: 'bot' });
export const apiLogger = logger.child({ module: 'api' });
export const dbLogger = logger.child({ module: 'db' });
export const panelLogger = logger.child({ module: 'panels' });
