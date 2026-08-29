import type { FastifyPluginAsync } from 'fastify';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { signSession, verifySession } from '../jwt.js';
import { env } from '../../env.js';

const DISCORD_API = 'https://discord.com/api/v10';
const SCOPES = 'identify guilds';

function oauthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: `${env.API_BASE_URL}/auth/callback`,
    response_type: 'code',
    scope: SCOPES,
    state,
    prompt: 'consent',
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

function generateState(): string {
  return randomBytes(32).toString('hex');
}

const callbackSchema = z.object({
  code: z.string(),
  state: z.string(),
});

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.get('/login', async (_request, reply) => {
    const state = generateState();
    reply.setCookie('oauth_state', state, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      maxAge: 60 * 5,
      sameSite: 'lax',
    });
    return reply.redirect(oauthUrl(state));
  });

  app.get('/callback', async (request, reply) => {
    const parsed = callbackSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: 'Missing required query parameters.' },
      });
    }
    const { code, state } = parsed.data;
    const storedState = request.cookies['oauth_state'];

    if (state !== storedState) {
      return reply.status(400).send({
        error: { code: 'OAUTH_FAILED', message: 'State mismatch. Please try logging in again.' },
      });
    }

    const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.DISCORD_CLIENT_ID,
        client_secret: env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${env.API_BASE_URL}/auth/callback`,
      }),
    });

    if (!tokenRes.ok) {
      return reply.status(400).send({
        error: { code: 'OAUTH_FAILED', message: 'Discord declined the login request. Please try again.' },
      });
    }

    const tokenData = await tokenRes.json() as { access_token: string };

    const userRes = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      return reply.status(400).send({
        error: { code: 'OAUTH_FAILED', message: "Couldn't fetch your Discord profile. Please try again." },
      });
    }

    const user = await userRes.json() as {
      id: string;
      username: string;
      avatar: string | null;
    };

    const jwt = await signSession({
      userId: user.id,
      username: user.username,
      avatar: user.avatar,
      accessToken: tokenData.access_token,
    });

    reply.setCookie('nexus_session', jwt, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      path: '/',
    });

    reply.clearCookie('oauth_state');

    return reply.redirect(
      env.DASHBOARD_URL ?? (env.NODE_ENV === 'production'
        ? 'https://your-dashboard.pages.dev/dashboard'
        : 'http://localhost:5173/dashboard'),
    );
  });

  app.post('/logout', async (_request, reply) => {
    reply.clearCookie('nexus_session', {
      path: '/',
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return reply.send({ ok: true });
  });

  app.get('/me', async (request, reply) => {
    const token = request.cookies['nexus_session'];
    if (token === undefined || token === '') {
      return reply.status(401).send({
        error: { code: 'UNAUTHORIZED', message: "You're not logged in." },
      });
    }
    const session = await verifySession(token);
    if (session === null) {
      return reply.status(401).send({
        error: { code: 'UNAUTHORIZED', message: 'Your session has expired. Please log in again.' },
      });
    }
    return reply.send({
      userId: session.userId,
      username: session.username,
      avatar: session.avatar,
    });
  });
};
