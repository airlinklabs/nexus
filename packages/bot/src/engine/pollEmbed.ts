import { EmbedBuilder } from 'discord.js';
import type { APIEmbed } from 'discord.js';
import type { UIDefinition, PollState } from 'shared/ui-types';

export function buildPollEmbed(definition: UIDefinition, state: PollState): APIEmbed {
  const baseEmbed = definition.embeds?.[0] ?? {};
  const meta = definition.meta as {
    showPercentages?: boolean;
    showVoterCount?: boolean;
    anonymous?: boolean;
  };
  const showPercentages = meta.showPercentages ?? true;
  const showVoterCount = meta.showVoterCount ?? true;

  const optionButtons = (definition.components ?? [])
    .flat()
    .filter(
      (c): c is import('shared/ui-types').ButtonDef =>
        c.type === 'button' && c.id.startsWith('vote:'),
    );

  const totalVotes = state.votes.length;

  const fields = optionButtons
    .map((btn) => {
      const optionValue = btn.id.slice('vote:'.length);
      const count = state.votes.filter((v) => v.optionValue === optionValue).length;
      const pct = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);

      const bar = buildBar(pct);
      const label = showPercentages
        ? `${bar} ${pct}% (${count})`
        : `${bar} ${count}`;

      return { name: btn.label, value: label, inline: false };
    })
    .filter((f): f is NonNullable<typeof f> => f !== null);

  const footer =
    showVoterCount
      ? {
          text: `${totalVotes} vote${totalVotes === 1 ? '' : 's'}${
            state.closed ? ' · Poll closed' : ''
          }`,
        }
      : undefined;

  return new EmbedBuilder(baseEmbed).setFields(fields).setFooter(footer ?? null).toJSON();
}

function buildBar(pct: number): string {
  const filled = Math.round(pct / 10);
  return '█'.repeat(filled) + '░'.repeat(10 - filled);
}
