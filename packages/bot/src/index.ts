import { Events } from 'discord.js';
import { client } from './client.js';
import { env } from './env.js';
import { loadCommands } from './commands/index.js';
import { dispatch } from './engine/dispatcher.js';
import { runMigrations } from './db/index.js';
import { purgeExpired } from './db/messageStore.js';

async function main(): Promise<void> {
  runMigrations();

  setInterval(() => {
    purgeExpired().catch((err: unknown) =>
      console.error('[nexus] Purge error:', err),
    );
  }, 10 * 60 * 1000);

  const commands = await loadCommands();

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`[nexus] Online as ${readyClient.user.tag}`);
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
      try {
        await dispatch(interaction);
      } catch (error) {
        console.error('[nexus] Dispatch error:', error);
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (command === undefined) {
      console.warn(`[nexus] Unknown command: ${interaction.commandName}`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`[nexus] Command error (${interaction.commandName}):`, error);
      const content = 'Something went wrong. Please try again.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content, ephemeral: true });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  });

  await client.login(env.DISCORD_TOKEN);
}

main().catch((error: unknown) => {
  console.error('[nexus] Fatal startup error:', error);
  process.exit(1);
});
