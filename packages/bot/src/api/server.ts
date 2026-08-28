import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { env } from '../env.js';
import { healthRoute } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { guildRoutes } from './routes/guilds.js';
import { messageRoutes } from './routes/messages.js';

export async function createServer() {
  const app = Fastify({ logger: env.NODE_ENV === 'development' });

  await app.register(rateLimit, {
    max: 30,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please wait a moment and try again.',
      },
    }),
  });

  await app.register(cookie, { secret: env.API_SECRET });

  await app.register(cors, {
    origin: env.DASHBOARD_URL !== undefined
      ? [env.DASHBOARD_URL]
      : env.NODE_ENV === 'production'
        ? ['https://your-dashboard.pages.dev']
        : ['http://localhost:5173'],
    credentials: true,
  });

  await app.register(healthRoute);
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(guildRoutes, { prefix: '/api/guilds' });
  await app.register(messageRoutes, { prefix: '/api/messages' });

  return app;
}
