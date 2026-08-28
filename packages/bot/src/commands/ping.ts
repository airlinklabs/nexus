import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from 'shared/slash-command';

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check if Nexus is online'),

  async execute(interaction) {
    const latency = interaction.client.ws.ping;
    await interaction.reply({
      content: `Pong! WebSocket latency: **${latency}ms**`,
      ephemeral: true,
    });
  },
};
