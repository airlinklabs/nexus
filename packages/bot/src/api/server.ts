import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../env.js';
import { healthRoute } from './routes/health.js';
import { authRoutes } from './routes/auth.js';
import { guildRoutes } from './routes/guilds.js';
import { messageRoutes } from './routes/messages.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DASHBOARD_DIST = join(__dirname, '../../../dashboard/dist');

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function serveDashboard(filePath: string): { status: number; body: Buffer | string; headers: Record<string, string> } | null {
  const fullPath = join(DASHBOARD_DIST, filePath);
  if (existsSync(fullPath) && statSync(fullPath).isFile()) {
    const ext = extname(fullPath);
    return {
      status: 200,
      body: readFileSync(fullPath),
      headers: { 'content-type': MIME_TYPES[ext] ?? 'application/octet-stream' },
    };
  }
  return null;
}

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

  const DEFS_DIST = join(__dirname, '../../../static/definitions');

function serveDef(filePath: string): { status: number; body: Buffer | string; headers: Record<string, string> } | null {
  const fullPath = join(DEFS_DIST, filePath);
  if (existsSync(fullPath) && statSync(fullPath).isFile()) {
    return {
      status: 200,
      body: readFileSync(fullPath),
      headers: { 'content-type': 'text/plain' },
    };
  }
  return null;
}

  if (env.NODE_ENV === 'production' && existsSync(DASHBOARD_DIST)) {
    app.get('/defs/*', async (req, reply) => {
      const filePath = req.url.replace(/^\/defs\//, '');
      const file = serveDef(filePath);
      if (file !== null) return reply.status(200).headers(file.headers).send(file.body);
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Definition not found' } });
    });

    app.get('/', async (_req, reply) => {
      const file = serveDashboard('index.html');
      if (file !== null) return reply.status(200).headers(file.headers).send(file.body);
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Dashboard not found' } });
    });

    app.get('/assets/*', async (req, reply) => {
      const path = req.url.replace(/^\/assets\//, '');
      const file = serveDashboard(join('assets', path));
      if (file !== null) return reply.status(200).headers(file.headers).send(file.body);
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Asset not found' } });
    });

    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api/') || request.url.startsWith('/auth/') || request.url.startsWith('/health')) {
        reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
      } else {
        const file = serveDashboard(request.url.slice(1)) ?? serveDashboard('index.html');
        if (file !== null) return reply.status(200).headers(file.headers).send(file.body);
        reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Not found' } });
      }
    });
  }

  return app;
}
