import { REST, Routes } from 'discord.js';
import { env } from '../env.js';
import { loadCommands } from '../commands/index.js';
import { logger } from '../logger.js';

const deployLogger = logger.child({ module: 'deploy' });

async function deploy(): Promise<void> {
  const commands = await loadCommands();
  const bodies = [...commands.values()].map((c) => c.data.toJSON());

  const rest = new REST().setToken(env.DISCORD_TOKEN);

  const route = env.GUILD_ID !== undefined
    ? Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.GUILD_ID)
    : Routes.applicationCommands(env.DISCORD_CLIENT_ID);

  const target = env.GUILD_ID !== undefined ? 'guild' : 'global';
  deployLogger.info({ count: bodies.length, target }, 'Registering commands');

  await rest.put(route, { body: bodies });
  deployLogger.info('Done');
}

deploy().catch((error: unknown) => {
  deployLogger.error({ err: error }, 'Failed');
  process.exit(1);
});
