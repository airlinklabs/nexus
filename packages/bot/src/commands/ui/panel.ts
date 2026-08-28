import type { ChatInputCommandInteraction } from 'discord.js';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { panels } from '../../db/schema.js';
import { resolveDefinition, checkAndReply } from './_shared.js';
import { buildMessageOptions } from '../../engine/components.js';

export async function handlePanel(interaction: ChatInputCommandInteraction): Promise<void> {
  const allowed = await checkAndReply(interaction);
  if (!allowed) return;

  await interaction.deferReply({ ephemeral: true });

  const definitionRaw = interaction.options.getString('definition', true);
  const panelName = interaction.options.getString('name', true);
  const guildId = interaction.guildId ?? 'dm';
  const channelId = interaction.channelId;

  const definition = await resolveDefinition(definitionRaw, guildId);
  if (typeof definition === 'string') {
    await interaction.editReply({ content: `❌ ${definition}` });
    return;
  }

  const messageOptions = buildMessageOptions(definition);

  const existing = await db.query.panels.findFirst({
    where: and(eq(panels.panelId, panelName), eq(panels.guildId, guildId)),
  });

  if (existing !== undefined && existing.messageId !== null) {
    try {
      const channel = await interaction.client.channels.fetch(existing.channelId);
      if (channel !== null && 'isTextBased' in channel && channel.isTextBased() && 'send' in channel) {
        const msg = await channel.messages.fetch(existing.messageId);
        await msg.edit(messageOptions);
        await db
          .update(panels)
          .set({
            definitionSource: definitionRaw,
            definitionJson: JSON.stringify(definition),
            updatedAt: new Date(),
          })
          .where(and(eq(panels.panelId, panelName), eq(panels.guildId, guildId)));
        await interaction.editReply({ content: `✅ Panel **${panelName}** updated.` });
        return;
      }
    } catch {
      // Message no longer exists — fall through to send a new one
    }
  }

  const targetChannel = await interaction.client.channels.fetch(channelId);
  if (targetChannel === null || !('isTextBased' in targetChannel) || !targetChannel.isTextBased() || !('send' in targetChannel)) {
    await interaction.editReply({ content: '❌ This channel does not support messages.' });
    return;
  }

  const sent = await targetChannel.send(messageOptions);

  const now = new Date();
  await db
    .insert(panels)
    .values({
      panelId: panelName,
      guildId,
      channelId,
      messageId: sent.id,
      definitionSource: definitionRaw,
      definitionJson: JSON.stringify(definition),
      createdBy: interaction.user.id,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [panels.panelId, panels.guildId],
      set: {
        channelId,
        messageId: sent.id,
        definitionSource: definitionRaw,
        definitionJson: JSON.stringify(definition),
        updatedAt: now,
      },
    });

  await interaction.editReply({ content: `✅ Panel **${panelName}** created.` });
}
