import type { ChatInputCommandInteraction } from 'discord.js';
import { parseCommonOptions, resolveDefinition, sendUI } from './_shared.js';

export async function handleForm(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.deferReply({ ephemeral: false });

  const opts = parseCommonOptions(interaction);
  const definition = await resolveDefinition(opts.definitionRaw, interaction.guildId ?? 'dm');

  if (typeof definition === 'string') {
    await interaction.editReply({ content: `❌ ${definition}` });
    return;
  }

  await sendUI(interaction, definition, opts);
}
