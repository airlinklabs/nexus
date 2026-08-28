import type { ChatInputCommandInteraction } from 'discord.js';
import { checkAndReply, sendUI } from './_shared.js';
import { loadRemoteDefinition } from '../../engine/remoteLoader.js';
import { getGuildConfig } from '../../db/guildConfig.js';

export async function handleFile(interaction: ChatInputCommandInteraction): Promise<void> {
  const allowed = await checkAndReply(interaction);
  if (!allowed) return;

  const guildId = interaction.guildId;
  if (guildId === null) {
    await interaction.reply({ content: 'This command cannot be used in DMs.', ephemeral: true });
    return;
  }

  const url = interaction.options.getString('url', true);
  const expiresInSeconds = interaction.options.getInteger('expires-in', false);
  const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? false;

  await interaction.deferReply({ ephemeral });

  const config = await getGuildConfig(guildId);
  const result = await loadRemoteDefinition(url, config.trustedDomains);

  if (!result.ok) {
    await interaction.editReply({ content: `Failed to load definition: ${result.error}` });
    return;
  }

  await sendUI(interaction, result.definition, {
    definitionRaw: url,
    allowedRoles: null,
    callerOnly: false,
    expiresInSeconds,
    ephemeral,
  });
}
