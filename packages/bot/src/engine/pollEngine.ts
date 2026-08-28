import type { UIDefinition, PollState, ButtonHandler, UserId } from 'shared/ui-types';
import { updateState, getMessage } from '../db/messageStore.js';
import { buildPollEmbed } from './pollEmbed.js';

export function wrapPollDefinition(definition: UIDefinition): UIDefinition {
  const voteButtonIds = (definition.components ?? [])
    .flat()
    .filter((c): c is import('shared/ui-types').ButtonDef => c.type === 'button' && c.id.startsWith('vote:'))
    .map((c) => c.id);

  if (voteButtonIds.length === 0) return definition;

  const injectedHandlers: Record<string, ButtonHandler> = {};

  for (const buttonId of voteButtonIds) {
    const optionValue = buttonId.slice('vote:'.length);

    injectedHandlers[buttonId] = async ({ interaction, state, callerId }) => {
      const pollState = state as unknown as PollState;
      const allowMultiple =
        (definition.meta as { allowMultipleVotes?: boolean }).allowMultipleVotes ?? false;

      const existingVote = pollState.votes.find((v) => v.userId === callerId);

      if (!allowMultiple && existingVote !== undefined) {
        if (existingVote.optionValue === optionValue) {
          await updateState(interaction.message.id, (prev) => {
            const s = prev as unknown as PollState;
            return {
              ...s,
              votes: s.votes.filter((v) => v.userId !== callerId),
            } as unknown as Record<string, unknown>;
          });
        } else {
          await updateState(interaction.message.id, (prev) => {
            const s = prev as unknown as PollState;
            return {
              ...s,
              votes: [
                ...s.votes.filter((v) => v.userId !== callerId),
                { userId: callerId, optionValue, votedAt: Date.now() },
              ],
            } as unknown as Record<string, unknown>;
          });
        }
      } else if (existingVote === undefined) {
        await updateState(interaction.message.id, (prev) => {
          const s = prev as unknown as PollState;
          return {
            ...s,
            votes: [
              ...s.votes,
              { userId: callerId, optionValue, votedAt: Date.now() },
            ],
          } as unknown as Record<string, unknown>;
        });
      }

      const updated = await getMessage(interaction.message.id);
      if (updated === null) return;

      const newEmbed = buildPollEmbed(definition, updated.state as unknown as PollState);
      await interaction.update({ embeds: [newEmbed] });
    };
  }

  return {
    ...definition,
    initialState: {
      __type: 'poll',
      votes: [],
      closed: false,
    },
    handlers: {
      ...definition.handlers,
      buttons: {
        ...injectedHandlers,
        ...definition.handlers?.buttons,
      },
    },
  };
}
