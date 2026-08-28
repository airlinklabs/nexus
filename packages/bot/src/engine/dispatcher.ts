import type {
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalSubmitInteraction,
  GuildMember,
} from 'discord.js';
import { getMessage } from '../db/messageStore.js';
import { checkComponentPermission, denialMessage } from '../permissions/index.js';
import { logInteraction } from '../db/interactionLog.js';
import type { UserId } from 'shared/ui-types';

type DispatchableInteraction =
  | ButtonInteraction
  | StringSelectMenuInteraction
  | ModalSubmitInteraction;

export async function dispatch(interaction: DispatchableInteraction): Promise<void> {
  const messageId = interaction.message?.id;
  if (messageId === undefined) return;

  const stored = await getMessage(messageId);

  if (stored === null) {
    await interaction.reply({
      content: 'This component has expired or is no longer active.',
      ephemeral: true,
    });
    return;
  }

  const member = interaction.member as GuildMember | null;
  if (member === null) {
    await interaction.reply({ content: 'This component cannot be used in DMs.', ephemeral: true });
    return;
  }

  const componentId = interaction.customId;
  const permResult = checkComponentPermission(stored, componentId, member);

  const componentType = interaction.isButton()
    ? 'button'
    : interaction.isStringSelectMenu()
      ? 'select'
      : 'modal';

  await logInteraction({
    messageId: stored.messageId,
    guildId: stored.guildId,
    userId: interaction.user.id,
    componentId,
    componentType,
    outcome: permResult.allowed ? 'allowed' : `denied:${permResult.reason}`,
  }).catch((err: unknown) => console.error('[nexus] Log interaction error:', err));

  if (!permResult.allowed) {
    await interaction.reply({
      content: denialMessage(permResult.reason),
      ephemeral: true,
    });
    return;
  }

  const callerId = interaction.user.id as UserId;
  const handlers = stored.definition.handlers;

  if (interaction.isButton()) {
    const id = interaction.customId;
    const handler = handlers?.buttons?.[id];
    if (handler === undefined) return;

    await handler({
      interaction,
      state: stored.state,
      callerId,
    });
    return;
  }

  if (interaction.isStringSelectMenu()) {
    const id = interaction.customId;
    const handler = handlers?.selects?.[id];
    if (handler === undefined) return;

    await handler({
      interaction,
      values: interaction.values,
      state: stored.state,
      callerId,
    });
    return;
  }

  if (interaction.isModalSubmit()) {
    const id = interaction.customId;
    const handler = handlers?.modals?.[id];
    if (handler === undefined) return;

    const fields: Record<string, string> = {};
    for (const [key, field] of interaction.fields.fields) {
      if ('value' in field && typeof field.value === 'string') {
        fields[key] = field.value;
      }
    }

    await handler({
      interaction,
      fields,
      state: stored.state,
      callerId,
    });
    return;
  }
}
