import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { sessionMiddleware, requireSession } from '../middleware/session.js';
import { getGuildConfig, addTrustedDomain, removeTrustedDomain, setCommandRoles } from '../../db/guildConfig.js';
import type { RoleId } from 'shared/ui-types';

const DISCORD_API = 'https://discord.com/api/v10';

async function fetchAdminGuilds(accessToken: string): Promise<Array<{ id: string; name: string; icon: string | null }>> {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];

  const all = await res.json() as Array<{
    id: string;
    name: string;
    icon: string | null;
    permissions: string;
  }>;

  return all.filter((g) => (BigInt(g.permissions) & 0x8n) !== 0n);
}

async function assertGuildAdmin(accessToken: string, guildId: string): Promise<boolean> {
  const guilds = await fetchAdminGuilds(accessToken);
  return guilds.some((g) => g.id === guildId);
}

const guildIdSchema = z.object({ guildId: z.string() });
const trustedDomainsSchema = z.object({
  action: z.enum(['add', 'remove']),
  domain: z.string().min(3),
});
const commandRolesSchema = z.object({
  commandName: z.string(),
  roleIds: z.array(z.string()),
});

export const guildRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', sessionMiddleware);
  app.addHook('preHandler', requireSession);

  app.get('/', async (request, reply) => {
    const session = request.session!;
    const adminGuilds = await fetchAdminGuilds(session.accessToken);
    return reply.send({ guilds: adminGuilds });
  });

  app.get('/:guildId', async (request, reply) => {
    const parsed = guildIdSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: 'Invalid guild ID.' },
      });
    }
    const { guildId } = parsed.data;
    const adminGuilds = await fetchAdminGuilds(request.session!.accessToken);
    const guild = adminGuilds.find((g) => g.id === guildId);
    if (guild === undefined) {
      return reply.status(403).send({
        error: { code: 'FORBIDDEN', message: "You're not an admin of that server." },
      });
    }
    const config = await getGuildConfig(guildId);
    return reply.send({ config, guild });
  });

  app.patch('/:guildId/trusted-domains', async (request, reply) => {
    const paramsParsed = guildIdSchema.safeParse(request.params);
    if (!paramsParsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: 'Invalid guild ID.' },
      });
    }
    const bodyParsed = trustedDomainsSchema.safeParse(request.body);
    if (!bodyParsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: 'Provide an action (add/remove) and a domain.' },
      });
    }
    const { guildId } = paramsParsed.data;
    const { action, domain } = bodyParsed.data;

    const isAdmin = await assertGuildAdmin(request.session!.accessToken, guildId);
    if (!isAdmin) {
      return reply.status(403).send({
        error: { code: 'FORBIDDEN', message: "You're not an admin of that server." },
      });
    }

    if (action === 'add') {
      await addTrustedDomain(guildId, domain.toLowerCase());
    } else {
      await removeTrustedDomain(guildId, domain.toLowerCase());
    }

    return reply.send({ ok: true });
  });

  app.patch('/:guildId/command-roles', async (request, reply) => {
    const paramsParsed = guildIdSchema.safeParse(request.params);
    if (!paramsParsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: 'Invalid guild ID.' },
      });
    }
    const bodyParsed = commandRolesSchema.safeParse(request.body);
    if (!bodyParsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: 'Provide a command name and role IDs.' },
      });
    }
    const { guildId } = paramsParsed.data;
    const { commandName, roleIds } = bodyParsed.data;

    const isAdmin = await assertGuildAdmin(request.session!.accessToken, guildId);
    if (!isAdmin) {
      return reply.status(403).send({
        error: { code: 'FORBIDDEN', message: "You're not an admin of that server." },
      });
    }

    await setCommandRoles(guildId, commandName, roleIds as RoleId[]);
    return reply.send({ ok: true });
  });
};
