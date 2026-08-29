import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { sessionMiddleware, requireSession } from '../middleware/session.js';
import { getGuildConfig, addTrustedDomain, removeTrustedDomain, setCommandRoles, setGlobalRole } from '../../db/guildConfig.js';
import { env } from '../../env.js';
import type { RoleId } from 'shared/ui-types';

const DISCORD_API = 'https://discord.com/api/v10';

type DiscordGuild = { id: string; name: string; icon: string | null };

async function fetchUserGuilds(accessToken: string): Promise<ReadonlyArray<DiscordGuild>> {
  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[guilds] User guilds fetch failed: ${res.status} ${body}`);
    return [];
  }

  const all = await res.json() as Array<{
    id: string;
    name: string;
    icon: string | null;
  }>;

  console.log(`[guilds] User is in ${all.length} guild(s):`, all.map((g) => `${g.name} (${g.id})`).join(', '));
  return all;
}

let botGuildsCache: ReadonlyArray<DiscordGuild> = [];
let botGuildsCacheExpiry = 0;

async function fetchBotGuilds(): Promise<ReadonlyArray<DiscordGuild>> {
  if (Date.now() < botGuildsCacheExpiry && botGuildsCache.length > 0) {
    return botGuildsCache;
  }

  const res = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bot ${env.DISCORD_TOKEN}` },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`[guilds] Bot guilds fetch failed: ${res.status} ${body}`);
    return botGuildsCache;
  }

  const all = await res.json() as Array<{
    id: string;
    name: string;
    icon: string | null;
  }>;

  console.log(`[guilds] Bot is in ${all.length} guild(s):`, all.map((g) => `${g.name} (${g.id})`).join(', '));
  botGuildsCache = all;
  botGuildsCacheExpiry = Date.now() + 5 * 60 * 1000;
  return botGuildsCache;
}

async function fetchSharedGuilds(accessToken: string): Promise<ReadonlyArray<DiscordGuild>> {
  const [userGuilds, botGuilds] = await Promise.all([
    fetchUserGuilds(accessToken),
    fetchBotGuilds(),
  ]);

  const botGuildIds = new Set(botGuilds.map((g) => g.id));
  return userGuilds.filter((g) => botGuildIds.has(g.id));
}

async function isGuildMember(accessToken: string, guildId: string): Promise<boolean> {
  const shared = await fetchSharedGuilds(accessToken);
  return shared.some((g) => g.id === guildId);
}

async function fetchGuildRoles(accessToken: string, guildId: string): Promise<Array<{ id: string; name: string; color: number; position: number }>> {
  const res = await fetch(`${DISCORD_API}/guilds/${guildId}/roles`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];

  const roles = await res.json() as Array<{
    id: string;
    name: string;
    color: number;
    position: number;
  }>;

  return roles
    .filter((r) => r.name !== '@everyone')
    .sort((a, b) => b.position - a.position);
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
const globalRoleSchema = z.object({
  roleId: z.string().nullable(),
});

export const guildRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', sessionMiddleware);
  app.addHook('preHandler', requireSession);

  app.get('/', async (request, reply) => {
    const session = request.session!;
    console.log(`[guilds] Fetching shared guilds for user ${session.userId}`);
    const sharedGuilds = await fetchSharedGuilds(session.accessToken);
    console.log(`[guilds] Returning ${sharedGuilds.length} shared guild(s)`);
    return reply.send({ guilds: sharedGuilds });
  });

  app.get('/:guildId', async (request, reply) => {
    const parsed = guildIdSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: 'Invalid guild ID.' },
      });
    }
    const { guildId } = parsed.data;

    const isMember = await isGuildMember(request.session!.accessToken, guildId);
    if (!isMember) {
      return reply.status(403).send({
        error: { code: 'FORBIDDEN', message: 'The bot is not in that server.' },
      });
    }

    const sharedGuilds = await fetchSharedGuilds(request.session!.accessToken);
    const guild = sharedGuilds.find((g) => g.id === guildId);
    const config = await getGuildConfig(guildId);
    return reply.send({ config, guild: guild ?? { id: guildId, name: 'Unknown Server', icon: null } });
  });

  app.get('/:guildId/roles', async (request, reply) => {
    const parsed = guildIdSchema.safeParse(request.params);
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: 'Invalid guild ID.' },
      });
    }
    const { guildId } = parsed.data;

    const isMember = await isGuildMember(request.session!.accessToken, guildId);
    if (!isMember) {
      return reply.status(403).send({
        error: { code: 'FORBIDDEN', message: 'The bot is not in that server.' },
      });
    }

    const roles = await fetchGuildRoles(request.session!.accessToken, guildId);
    return reply.send({ roles });
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

    const isMember = await isGuildMember(request.session!.accessToken, guildId);
    if (!isMember) {
      return reply.status(403).send({
        error: { code: 'FORBIDDEN', message: 'The bot is not in that server.' },
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

    const isMember = await isGuildMember(request.session!.accessToken, guildId);
    if (!isMember) {
      return reply.status(403).send({
        error: { code: 'FORBIDDEN', message: 'The bot is not in that server.' },
      });
    }

    await setCommandRoles(guildId, commandName, roleIds as RoleId[]);
    return reply.send({ ok: true });
  });

  app.patch('/:guildId/global-role', async (request, reply) => {
    const paramsParsed = guildIdSchema.safeParse(request.params);
    if (!paramsParsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: 'Invalid guild ID.' },
      });
    }
    const bodyParsed = globalRoleSchema.safeParse(request.body);
    if (!bodyParsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: 'Provide a roleId or null.' },
      });
    }
    const { guildId } = paramsParsed.data;
    const { roleId } = bodyParsed.data;

    const isMember = await isGuildMember(request.session!.accessToken, guildId);
    if (!isMember) {
      return reply.status(403).send({
        error: { code: 'FORBIDDEN', message: 'The bot is not in that server.' },
      });
    }

    await setGlobalRole(guildId, roleId);
    return reply.send({ ok: true });
  });
};
