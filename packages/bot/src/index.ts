import type { FastifyInstance } from 'fastify';
import { Events, EmbedBuilder } from 'discord.js';
import { client } from './client.js';
import { env } from './env.js';
import { loadCommands } from './commands/index.js';
import { dispatch } from './engine/dispatcher.js';
import { runMigrations } from './db/index.js';
import { purgeExpired } from './db/messageStore.js';
import { createServer } from './api/server.js';
import { restorePanels } from './panels/restore.js';
import { botLogger } from './logger.js';
import type { PollState } from 'shared/ui-types';

let apiServer: FastifyInstance | null = null;

async function shutdown(signal: string): Promise<void> {
  botLogger.info({ signal }, 'Shutting down');

  try {
    if (apiServer !== null) {
      await apiServer.close();
      botLogger.info('API server closed');
    }

    await client.destroy();
    botLogger.info('Discord client destroyed');

    process.exit(0);
  } catch (error) {
    botLogger.error({ err: error }, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('unhandledRejection', (reason: unknown) => {
  botLogger.error({ reason }, 'Unhandled rejection');
});

process.on('uncaughtException', (error: Error) => {
  botLogger.fatal({ err: error }, 'Uncaught exception');
  process.exit(1);
});

async function main(): Promise<void> {
  runMigrations();

  setInterval(() => {
    purgeExpired()
      .then(async (expired) => {
        for (const msg of expired) {
          const state = msg.state as unknown as PollState;
          if (state.__type === 'poll' && !state.closed) {
            try {
              const channel = await client.channels.fetch(msg.channelId);
              if (channel !== null && 'isTextBased' in channel && channel.isTextBased() && 'messages' in channel) {
                const discordMsg = await channel.messages.fetch(msg.messageId);
                const closedState = { ...state, closed: true };
                const fields = (discordMsg.embeds[0]?.fields ?? []).map((f) => ({
                  name: f.name,
                  value: f.value.replace(/(\d+ votes?)/, '$1 · Poll closed'),
                  inline: f.inline ?? false,
                }));
                const embed = new EmbedBuilder(discordMsg.embeds[0]?.toJSON() ?? {}).setFields(fields);
                if (discordMsg.components.length > 0) {
                  await discordMsg.edit({ embeds: [embed], components: [] });
                } else {
                  await discordMsg.edit({ embeds: [embed] });
                }
              }
            } catch {
              // Message may already be deleted
            }
          }
        }
      })
      .catch((err: unknown) => botLogger.error({ err }, 'Purge error'));
  }, 10 * 60 * 1000);

  const commands = await loadCommands();

  client.once(Events.ClientReady, async (readyClient) => {
    botLogger.info({ tag: readyClient.user.tag }, 'Online');

    await restorePanels(readyClient);

    apiServer = await createServer();
    await apiServer.listen({ port: env.PORT, host: '0.0.0.0' });
    botLogger.info({ port: env.PORT }, 'API listening');
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (
      interaction.isButton() ||
      interaction.isStringSelectMenu() ||
      interaction.isModalSubmit()
    ) {
      try {
        await dispatch(interaction);
      } catch (error) {
        botLogger.error({ err: error }, 'Dispatch error');
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);
    if (command === undefined) {
      botLogger.warn({ command: interaction.commandName }, 'Unknown command');
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      botLogger.error(
        { err: error, command: interaction.commandName },
        'Command error',
      );
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
  botLogger.fatal({ err: error }, 'Fatal startup error');
  process.exit(1);
});
