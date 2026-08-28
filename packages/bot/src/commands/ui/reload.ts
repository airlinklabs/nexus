import type { ChatInputCommandInteraction } from 'discord.js';
import { PermissionFlagsBits } from 'discord.js';
import { invalidateCache } from '../../engine/remoteLoader.js';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { activeMessages } from '../../db/schema.js';

export async function handleReload(interaction: ChatInputCommandInteraction): Promise<void> {
  const member = interaction.member;
  if (member === null || !('permissions' in member)) {
    await interaction.reply({ content: 'This command cannot be used in DMs.', ephemeral: true });
    return;
  }

  const perms = BigInt(member.permissions as string);
  if ((perms & BigInt(PermissionFlagsBits.Administrator)) === 0n) {
    await interaction.reply({
      content: 'You need Administrator permission to reload definitions.',
      ephemeral: true,
    });
    return;
  }

  const url = interaction.options.getString('url', true);

  if (!url.startsWith('https://')) {
    await interaction.reply({ content: '❌ Only HTTPS URLs can be reloaded.', ephemeral: true });
    return;
  }

  invalidateCache(url);

  const affected = await db.query.activeMessages.findMany({
    where: eq(activeMessages.definitionSource, url),
  });

  await interaction.reply({
    content: `✅ Cache cleared for \`${url}\`. ${affected.length} active message(s) will use the new definition on next interaction.`,
    ephemeral: true,
  });
}
