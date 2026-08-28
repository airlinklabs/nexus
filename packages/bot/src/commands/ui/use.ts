import type { ChatInputCommandInteraction } from 'discord.js';
import { checkAndReply, sendUI } from './_shared.js';
import { getTemplateByName } from '../../db/templates.js';
import { evaluateDefinition } from '../../engine/sandbox.js';

export async function handleUse(interaction: ChatInputCommandInteraction): Promise<void> {
  const allowed = await checkAndReply(interaction);
  if (!allowed) return;

  const guildId = interaction.guildId;
  if (guildId === null) {
    await interaction.reply({ content: 'This command cannot be used in DMs.', ephemeral: true });
    return;
  }

  const templateName = interaction.options.getString('template', true);
  const argsRaw = interaction.options.getString('args', false);

  await interaction.deferReply({ ephemeral: false });

  const template = await getTemplateByName(guildId, templateName);
  if (template === null) {
    await interaction.editReply({
      content: `Template \`${templateName}\` not found. Use \`/ui templates\` to see available templates.`,
    });
    return;
  }

  const args = parseArgs(argsRaw);
  const substituted = substituteArgs(template.definitionSource, args);

  const result = evaluateDefinition(substituted);
  if (!result.ok) {
    await interaction.editReply({
      content: `Failed to evaluate template: ${result.error}`,
    });
    return;
  }

  const definition = { ...result.definition, args };

  await sendUI(interaction, definition, {
    definitionRaw: template.definitionSource,
    allowedRoles: null,
    callerOnly: false,
    expiresInSeconds: null,
    ephemeral: false,
  });
}

function parseArgs(raw: string | null): Record<string, string> {
  if (raw === null || raw.trim().length === 0) return {};

  const args: Record<string, string> = {};
  const pairs = raw.split(/\s+/);

  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) continue;

    const key = pair.slice(0, eqIdx);
    let value = pair.slice(eqIdx + 1);

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    args[key] = value;
  }

  return args;
}

function substituteArgs(source: string, args: Record<string, string>): string {
  let result = source;
  for (const [key, value] of Object.entries(args)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(pattern, value);
  }
  return result;
}
