import type { ChatInputCommandInteraction } from 'discord.js';
import { getMessage, deleteMessage } from '../../db/messageStore.js';

export async function handleDelete(interaction: ChatInputCommandInteraction): Promise<void> {
  const messageId = interaction.options.getString('message-id', true);
  const stored = await getMessage(messageId);

  if (stored === null) {
    await interaction.reply({ content: '❌ No active message found with that ID.', ephemeral: true });
    return;
  }

  const isAdmin = interaction.memberPermissions?.has('Administrator') ?? false;
  const isCaller = stored.callerId === interaction.user.id;

  if (!isAdmin && !isCaller) {
    await interaction.reply({
      content: 'You can only delete messages you created, unless you have Administrator permission.',
      ephemeral: true,
    });
    return;
  }

  try {
    const channel = await interaction.client.channels.fetch(stored.channelId);
    if (channel !== null && 'isTextBased' in channel && channel.isTextBased()) {
      const msg = await channel.messages.fetch(messageId);
      await msg.delete();
    }
  } catch {
    // Message may already be deleted — continue to clean up the DB record
  }

  await deleteMessage(messageId);

  await interaction.reply({
    content: `✅ Message \`${messageId}\` removed and deactivated.`,
    ephemeral: true,
  });
}
