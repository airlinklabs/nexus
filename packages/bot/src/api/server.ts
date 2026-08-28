import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { env } from '../env.js';
import { healthRoute } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { guildRoutes } from './routes/guilds.js';
import { messageRoutes } from './routes/messages.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

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

  // Serve dashboard in production
  const dashboardDist = join(__dirname, '../../../dashboard/dist');
  if (env.NODE_ENV === 'production' && existsSync(dashboardDist)) {
    await app.register(fastifyStatic, {
      root: dashboardDist,
      prefix: '/',
      decorateReply: false,
    });

    // SPA fallback - serve index.html for non-API routes
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api/') || request.url.startsWith('/auth/')) {
        reply.status(404).send({
          error: { code: 'NOT_FOUND', message: 'Route not found' },
        });
      } else {
        reply.sendFile('index.html');
      }
    });
  }

  return app;
}
