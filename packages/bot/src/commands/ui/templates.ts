import type { ChatInputCommandInteraction } from 'discord.js';
import { checkAndReply } from './_shared.js';
import { listTemplates } from '../../db/templates.js';
import { BUILT_IN_TEMPLATES } from '../../engine/builtinTemplates.js';

export async function handleTemplates(interaction: ChatInputCommandInteraction): Promise<void> {
  const allowed = await checkAndReply(interaction);
  if (!allowed) return;

  const guildId = interaction.guildId;
  if (guildId === null) {
    await interaction.reply({ content: 'This command cannot be used in DMs.', ephemeral: true });
    return;
  }

  const custom = await listTemplates(guildId);

  const builtInList = BUILT_IN_TEMPLATES
    .map((t) => `\`${t.name}\` — ${t.description}`)
    .join('\n');

  const customList = custom.length > 0
    ? custom
        .map((t) => {
          const desc = t.description.length > 0 ? ` — ${t.description}` : '';
          return `\`${t.name}\`${desc}`;
        })
        .join('\n')
    : 'None yet';

  await interaction.reply({
    embeds: [
      {
        title: 'Available Templates',
        color: 0x5865f2,
        fields: [
          { name: 'Built-in', value: builtInList, inline: false },
          { name: 'Custom', value: customList, inline: false },
        ],
        footer: { text: 'Use /ui use template:<name> to invoke' },
      },
    ],
    ephemeral: true,
  });
}
