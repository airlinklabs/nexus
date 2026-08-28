import { REST, Routes } from 'discord.js';
import { env } from '../env.js';
import { loadCommands } from '../commands/index.js';

async function deploy(): Promise<void> {
  const commands = await loadCommands();
  const bodies = [...commands.values()].map((c) => c.data.toJSON());

  const rest = new REST().setToken(env.DISCORD_TOKEN);

  const route = env.GUILD_ID !== undefined
    ? Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.GUILD_ID)
    : Routes.applicationCommands(env.DISCORD_CLIENT_ID);

  const target = env.GUILD_ID !== undefined ? 'guild' : 'global';
  console.log(`[deploy] Registering ${bodies.length} command(s) (${target})…`);

  await rest.put(route, { body: bodies });
  console.log('[deploy] Done.');
}

deploy().catch((error: unknown) => {
  console.error('[deploy] Failed:', error);
  process.exit(1);
});
