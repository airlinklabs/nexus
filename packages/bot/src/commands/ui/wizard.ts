import type { ChatInputCommandInteraction } from 'discord.js';
import { parseCommonOptions, resolveDefinition, checkAndReply } from './_shared.js';
import { buildPageOptions } from '../../engine/components.js';
import { storeMessage } from '../../db/messageStore.js';
import type { StoredMessage, UIDefinition, UserId } from 'shared/ui-types';

function toPageNumber(value: unknown): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export async function handleWizard(interaction: ChatInputCommandInteraction): Promise<void> {
  const allowed = await checkAndReply(interaction);
  if (!allowed) return;

  await interaction.deferReply({ ephemeral: false });

  const opts = parseCommonOptions(interaction);
  const definition = await resolveDefinition(opts.definitionRaw, interaction.guildId ?? 'dm');

  if (typeof definition === 'string') {
    await interaction.editReply({ content: `❌ ${definition}` });
    return;
  }

  if (definition.pages === undefined || definition.pages.length === 0) {
    await interaction.editReply({ content: '❌ Wizard definition requires a `pages` array.' });
    return;
  }

  const wizardDefinition: UIDefinition = {
    ...definition,
    initialState: { ...definition.initialState, __page: 0 },
    handlers: {
      ...definition.handlers,
      buttons: {
        ...definition.handlers?.buttons,
        __prev: async ({ interaction: i, state }) => {
          const page = Math.max(0, toPageNumber(state['__page']) - 1);
          const msgOpts = buildPageOptions(definition, page);
          await i.update({ ...msgOpts });
        },
        __next: async ({ interaction: i, state }) => {
          const maxPage = (definition.pages?.length ?? 1) - 1;
          const page = Math.min(maxPage, toPageNumber(state['__page']) + 1);
          const msgOpts = buildPageOptions(definition, page);
          await i.update({ ...msgOpts });
        },
      },
    },
  };

  const pageOpts = buildPageOptions(wizardDefinition, 0);
  const reply = await interaction.editReply(pageOpts);

  const stored: StoredMessage = {
    messageId: reply.id,
    channelId: interaction.channelId,
    guildId: interaction.guildId ?? 'dm',
    callerId: interaction.user.id as UserId,
    definition: wizardDefinition,
    state: { __page: 0, ...(definition.initialState ?? {}) },
    expiresAt: opts.expiresInSeconds !== null ? Date.now() + opts.expiresInSeconds * 1000 : null,
  };

  await storeMessage(stored, opts.definitionRaw);
}
