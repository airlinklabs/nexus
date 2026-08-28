import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifySession, type SessionPayload } from '../jwt.js';

declare module 'fastify' {
  interface FastifyRequest {
    session: SessionPayload | null;
  }
}

export async function sessionMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const token = request.cookies['nexus_session'];
  if (token === undefined || token === '') {
    request.session = null;
    return;
  }
  request.session = await verifySession(token);
}

export async function requireSession(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (request.session === null) {
    await reply.status(401).send({
      error: {
        code: 'UNAUTHORIZED',
        message: 'You need to log in to do that.',
      },
    });
  }
}
