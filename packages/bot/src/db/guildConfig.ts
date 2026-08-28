import { eq } from 'drizzle-orm';
import { db } from './index.js';
import { guilds } from './schema.js';
import type { RoleId } from 'shared/ui-types';

export type GuildConfig = {
  readonly guildId: string;
  readonly trustedDomains: ReadonlyArray<string>;
  readonly commandRoles: Record<string, ReadonlyArray<RoleId>>;
  readonly auditChannelId: string | null;
  readonly defaultExpiry: number | null;
};

function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export async function getGuildConfig(guildId: string): Promise<GuildConfig> {
  const row = await db.query.guilds.findFirst({
    where: eq(guilds.guildId, guildId),
  });

  if (row === undefined) {
    return {
      guildId,
      trustedDomains: ['raw.githubusercontent.com', 'gist.githubusercontent.com'],
      commandRoles: {},
      auditChannelId: null,
      defaultExpiry: null,
    };
  }

  return {
    guildId: row.guildId,
    trustedDomains: safeJsonParse<string[]>(row.trustedDomains, []),
    commandRoles: safeJsonParse<Record<string, RoleId[]>>(row.commandRoles, {}),
    auditChannelId: row.auditChannelId ?? null,
    defaultExpiry: row.defaultExpiry ?? null,
  };
}

export async function upsertGuildConfig(config: GuildConfig): Promise<void> {
  const now = new Date();
  await db
    .insert(guilds)
    .values({
      guildId: config.guildId,
      trustedDomains: JSON.stringify(config.trustedDomains),
      commandRoles: JSON.stringify(config.commandRoles),
      auditChannelId: config.auditChannelId,
      defaultExpiry: config.defaultExpiry,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: guilds.guildId,
      set: {
        trustedDomains: JSON.stringify(config.trustedDomains),
        commandRoles: JSON.stringify(config.commandRoles),
        auditChannelId: config.auditChannelId,
        defaultExpiry: config.defaultExpiry,
        updatedAt: now,
      },
    });
}

export async function addTrustedDomain(guildId: string, domain: string): Promise<void> {
  const config = await getGuildConfig(guildId);
  if (config.trustedDomains.includes(domain)) return;
  await upsertGuildConfig({
    ...config,
    trustedDomains: [...config.trustedDomains, domain],
  });
}

export async function removeTrustedDomain(guildId: string, domain: string): Promise<void> {
  const config = await getGuildConfig(guildId);
  await upsertGuildConfig({
    ...config,
    trustedDomains: config.trustedDomains.filter((d) => d !== domain),
  });
}

export async function setCommandRoles(
  guildId: string,
  commandName: string,
  roleIds: ReadonlyArray<RoleId>,
): Promise<void> {
  const config = await getGuildConfig(guildId);
  await upsertGuildConfig({
    ...config,
    commandRoles: { ...config.commandRoles, [commandName]: roleIds },
  });
}
