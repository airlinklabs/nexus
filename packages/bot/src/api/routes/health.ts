import type { FastifyPluginAsync } from 'fastify';

export const healthRoute: FastifyPluginAsync = async (app) => {
  app.get('/health', async (_request, reply) => {
    return reply.send({ status: 'ok', uptime: process.uptime() });
  });
};
