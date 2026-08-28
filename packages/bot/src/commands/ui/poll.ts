import type { ChatInputCommandInteraction } from 'discord.js';
import { parseCommonOptions, resolveDefinition, sendUI, checkAndReply } from './_shared.js';
import { wrapPollDefinition } from '../../engine/pollEngine.js';

export async function handlePoll(interaction: ChatInputCommandInteraction): Promise<void> {
  const allowed = await checkAndReply(interaction);
  if (!allowed) return;

  await interaction.deferReply({ ephemeral: false });

  const opts = parseCommonOptions(interaction);
  const definition = await resolveDefinition(opts.definitionRaw, interaction.guildId ?? 'dm');

  if (typeof definition === 'string') {
    await interaction.editReply({ content: `❌ ${definition}` });
    return;
  }

  const wrappedDefinition = wrapPollDefinition(definition);
  await sendUI(interaction, wrappedDefinition, opts);
}
