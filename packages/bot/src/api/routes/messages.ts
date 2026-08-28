import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { activeMessages, interactionLog } from '../../db/schema.js';
import { sessionMiddleware, requireSession } from '../middleware/session.js';

const guildIdSchema = z.object({ guildId: z.string() });
const logQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(200).default(50) });

export const messageRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', sessionMiddleware);
  app.addHook('preHandler', requireSession);

  app.get('/:guildId', async (request, reply) => {
    const parsed = guildIdSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: 'Invalid guild ID.' },
      });
    }
    const { guildId } = parsed.data;
    const rows = await db.query.activeMessages.findMany({
      where: eq(activeMessages.guildId, guildId),
      orderBy: [desc(activeMessages.createdAt)],
      limit: 50,
      columns: {
        messageId: true,
        channelId: true,
        callerId: true,
        expiresAt: true,
        createdAt: true,
      },
    });
    return reply.send({ messages: rows });
  });

  app.get('/:guildId/log', async (request, reply) => {
    const paramsParsed = guildIdSchema.safeParse(request.params);
    if (!paramsParsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: 'Invalid guild ID.' },
      });
    }
    const queryParsed = logQuerySchema.safeParse(request.query);
    if (!queryParsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: 'Invalid query parameters.' },
      });
    }
    const { guildId } = paramsParsed.data;
    const { limit } = queryParsed.data;
    const rows = await db.query.interactionLog.findMany({
      where: eq(interactionLog.guildId, guildId),
      orderBy: [desc(interactionLog.occurredAt)],
      limit,
    });
    return reply.send({ log: rows });
  });
};
