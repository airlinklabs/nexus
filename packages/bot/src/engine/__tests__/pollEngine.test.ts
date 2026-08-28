import { describe, it, expect } from 'vitest';
import { buildPollEmbed } from '../pollEmbed.js';
import type { UIDefinition, PollState } from 'shared/ui-types';

const definition: UIDefinition = {
  meta: {},
  embeds: [{ title: 'Test poll', color: 0x5865f2 }],
  components: [[
    { type: 'button', id: 'vote:a', label: 'Option A', style: 'secondary' },
    { type: 'button', id: 'vote:b', label: 'Option B', style: 'secondary' },
  ]],
};

describe('buildPollEmbed', () => {
  it('shows 0% for all options when no votes cast', () => {
    const state: PollState = { __type: 'poll', votes: [], closed: false };
    const embed = buildPollEmbed(definition, state);
    expect(embed.fields?.every((f) => f.value.includes('0%'))).toBe(true);
  });

  it('calculates percentages correctly with votes', () => {
    const state: PollState = {
      __type: 'poll',
      votes: [
        { userId: 'u1', optionValue: 'a', votedAt: Date.now() },
        { userId: 'u2', optionValue: 'a', votedAt: Date.now() },
        { userId: 'u3', optionValue: 'b', votedAt: Date.now() },
      ],
      closed: false,
    };
    const embed = buildPollEmbed(definition, state);
    const fieldA = embed.fields?.find((f) => f.name === 'Option A');
    const fieldB = embed.fields?.find((f) => f.name === 'Option B');
    expect(fieldA?.value).toContain('67%');
    expect(fieldB?.value).toContain('33%');
  });

  it('shows "Poll closed" in footer when state.closed is true', () => {
    const state: PollState = { __type: 'poll', votes: [], closed: true };
    const embed = buildPollEmbed(definition, state);
    expect(embed.footer?.text).toContain('Poll closed');
  });
});
