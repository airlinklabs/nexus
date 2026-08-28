import type { ChatInputCommandInteraction } from 'discord.js';
import { checkAndReply } from './_shared.js';
import { listTemplates } from '../../db/templates.js';

export async function handleTemplates(interaction: ChatInputCommandInteraction): Promise<void> {
  const allowed = await checkAndReply(interaction);
  if (!allowed) return;

  const guildId = interaction.guildId;
  if (guildId === null) {
    await interaction.reply({ content: 'This command cannot be used in DMs.', ephemeral: true });
    return;
  }

  const templates = await listTemplates(guildId);

  if (templates.length === 0) {
    await interaction.reply({
      content: 'No templates yet. Create one in the dashboard or use `/ui dialog` to build a UI from scratch.',
      ephemeral: true,
    });
    return;
  }

  const list = templates
    .map((t) => {
      const desc = t.description.length > 0 ? ` — ${t.description}` : '';
      return `\`${t.name}\`${desc}`;
    })
    .join('\n');

  await interaction.reply({
    content: `**Templates**\n${list}\n\nUse \`/ui use template:<name> args:key=value\` to invoke one.`,
    ephemeral: true,
  });
}
