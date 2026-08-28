import type { UIDefinition } from 'shared/ui-types';

export type BuiltInTemplate = {
  readonly name: string;
  readonly description: string;
  readonly category: string;
  readonly definition: UIDefinition;
  readonly argsDescription: string;
};

function poll(): UIDefinition {
  return {
    meta: {},
    embeds: [
      {
        title: '{{question}}',
        description: '{{description}}',
        color: 0x5865f2,
        fields: [],
        footer: { text: 'Poll created by {{author}}' },
      },
    ],
    initialState: { votes: {} },
    components: [
      [
        { type: 'button', id: 'vote_a', label: '{{option1}}', style: 'primary' },
        { type: 'button', id: 'vote_b', label: '{{option2}}', style: 'primary' },
      ],
      [
        { type: 'button', id: 'vote_c', label: '{{option3}}', style: 'secondary' },
        { type: 'button', id: 'vote_d', label: '{{option4}}', style: 'secondary' },
      ],
    ],
    handlers: {
      buttons: {
        vote_a: async function (ctx) { await ctx.interaction.reply({ content: 'You voted for **Option A**!', flags: 64 }); },
        vote_b: async function (ctx) { await ctx.interaction.reply({ content: 'You voted for **Option B**!', flags: 64 }); },
        vote_c: async function (ctx) { await ctx.interaction.reply({ content: 'You voted for **Option C**!', flags: 64 }); },
        vote_d: async function (ctx) { await ctx.interaction.reply({ content: 'You voted for **Option D**!', flags: 64 }); },
      },
    },
  };
}

function feedback(): UIDefinition {
  return {
    meta: {},
    embeds: [
      {
        title: '{{title}}',
        description: '{{description}}',
        color: 0x57f287,
        fields: [
          { name: 'How to respond', value: 'Click a button below to send your feedback.', inline: false },
        ],
      },
    ],
    components: [
      [
        { type: 'button', id: 'fb_positive', label: '👍 Positive', style: 'success' },
        { type: 'button', id: 'fb_negative', label: '👎 Negative', style: 'danger' },
        { type: 'button', id: 'fb_neutral', label: '🤔 Neutral', style: 'secondary' },
      ],
    ],
    handlers: {
      buttons: {
        fb_positive: async function (ctx) { await ctx.interaction.reply({ content: 'Thanks for your positive feedback!', flags: 64 }); },
        fb_negative: async function (ctx) { await ctx.interaction.reply({ content: 'Thanks for your feedback. We will look into it.', flags: 64 }); },
        fb_neutral: async function (ctx) { await ctx.interaction.reply({ content: 'Thanks for your feedback!', flags: 64 }); },
      },
    },
  };
}

function ticket(): UIDefinition {
  return {
    meta: {},
    embeds: [
      {
        title: '{{title}}',
        description: '{{description}}',
        color: 0xfee75c,
        fields: [
          { name: 'Need help?', value: 'Click the button below to open a support ticket.', inline: false },
        ],
      },
    ],
    components: [
      [
        { type: 'button', id: 'open_ticket', label: '🎫 Open Ticket', style: 'primary' },
      ],
    ],
    handlers: {
      buttons: {
        open_ticket: async function (ctx) {
          await ctx.interaction.reply({ content: 'Ticket opened! A staff member will be with you shortly.', flags: 64 });
        },
      },
    },
  };
}

function welcome(): UIDefinition {
  return {
    meta: {},
    embeds: [
      {
        title: '{{title}}',
        description: '{{description}}',
        color: 0x5865f2,
        fields: [
          { name: 'Rules', value: '{{rules}}', inline: false },
        ],
        footer: { text: 'Welcome to the server!' },
      },
    ],
    components: [
      [
        { type: 'button', id: 'verify', label: '✅ I agree', style: 'success' },
      ],
    ],
    handlers: {
      buttons: {
        verify: async function (ctx) {
          await ctx.interaction.reply({ content: 'Welcome! You have been verified.', flags: 64 });
        },
      },
    },
  };
}

function announcement(): UIDefinition {
  return {
    meta: {},
    embeds: [
      {
        title: '{{title}}',
        description: '{{description}}',
        color: 0xeb459e,
        fields: [],
      },
    ],
    components: [
      [
        { type: 'button', id: 'ack', label: '📌 Acknowledged', style: 'secondary' },
      ],
    ],
    handlers: {
      buttons: {
        ack: async function (ctx) {
          await ctx.interaction.reply({ content: 'You acknowledged this announcement.', flags: 64 });
        },
      },
    },
  };
}

function roleSelect(): UIDefinition {
  return {
    meta: {},
    embeds: [
      {
        title: '{{title}}',
        description: '{{description}}',
        color: 0x5865f2,
      },
    ],
    components: [
      [
        {
          type: 'select',
          id: 'role_pick',
          placeholder: '{{placeholder}}',
          options: [
            { value: 'role1', label: '{{role1_name}}' },
            { value: 'role2', label: '{{role2_name}}' },
            { value: 'role3', label: '{{role3_name}}' },
          ],
        },
      ],
    ],
    handlers: {
      selects: {
        role_pick: async function (ctx) {
          await ctx.interaction.reply({ content: 'You selected: **' + ctx.values[0] + '**', flags: 64 });
        },
      },
    },
  };
}

export const BUILT_IN_TEMPLATES: ReadonlyArray<BuiltInTemplate> = [
  {
    name: 'poll',
    description: 'A simple poll with up to 4 options',
    category: 'Engagement',
    definition: poll(),
    argsDescription: 'question, description, option1-4, author',
  },
  {
    name: 'feedback',
    description: 'Collect positive/negative/neutral feedback',
    category: 'Engagement',
    definition: feedback(),
    argsDescription: 'title, description',
  },
  {
    name: 'ticket',
    description: 'Support ticket opener',
    category: 'Support',
    definition: ticket(),
    argsDescription: 'title, description',
  },
  {
    name: 'welcome',
    description: 'Welcome message with rules and verify button',
    category: 'Onboarding',
    definition: welcome(),
    argsDescription: 'title, description, rules',
  },
  {
    name: 'announcement',
    description: 'Announcement with acknowledgment button',
    category: 'Communication',
    definition: announcement(),
    argsDescription: 'title, description',
  },
  {
    name: 'role-select',
    description: 'Dropdown menu for role selection',
    category: 'Roles',
    definition: roleSelect(),
    argsDescription: 'title, description, placeholder, role1-3_name',
  },
];

export function getBuiltInTemplate(name: string): BuiltInTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.name === name);
}
