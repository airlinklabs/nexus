import { SlashCommandBuilder } from 'discord.js';
import type { SlashCommand } from 'shared/slash-command';
import type { ChatInputCommandInteraction } from 'discord.js';
import { handleDialog } from './dialog.js';
import { handleConfirm } from './confirm.js';
import { handleMenu } from './menu.js';
import { handleForm } from './form.js';
import { handlePoll } from './poll.js';
import { handleEmbed } from './embed.js';
import { handleWizard } from './wizard.js';
import { handlePanel } from './panel.js';
import { handleReload } from './reload.js';
import { handleDelete } from './delete.js';
import { handleUse } from './use.js';
import { handleTemplates } from './templates.js';
import { handleFile } from './file.js';

const SUBCOMMAND_HANDLERS: Record<
  string,
  (interaction: ChatInputCommandInteraction) => Promise<void>
> = {
  dialog: handleDialog,
  confirm: handleConfirm,
  menu: handleMenu,
  form: handleForm,
  poll: handlePoll,
  embed: handleEmbed,
  wizard: handleWizard,
  panel: handlePanel,
  reload: handleReload,
  delete: handleDelete,
  use: handleUse,
  templates: handleTemplates,
  file: handleFile,
};

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ui')
    .setDescription('Build interactive UI elements inside Discord')
    .addSubcommand((sub) =>
      sub
        .setName('dialog')
        .setDescription('Send a message with up to 5 buttons')
        .addStringOption((opt) =>
          opt.setName('definition').setDescription('JS definition object or https:// URL').setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName('allowed-roles').setDescription('Comma-separated role IDs that can interact').setRequired(false),
        )
        .addBooleanOption((opt) =>
          opt.setName('caller-only').setDescription('Only the person who ran this command can interact').setRequired(false),
        )
        .addIntegerOption((opt) =>
          opt.setName('expires-in').setDescription('Disable components after this many seconds').setRequired(false),
        )
        .addBooleanOption((opt) =>
          opt.setName('ephemeral').setDescription('Only you can see the message').setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('confirm')
        .setDescription('Send a two-button confirm / cancel prompt')
        .addStringOption((opt) =>
          opt.setName('definition').setDescription('JS definition object or https:// URL').setRequired(true),
        )
        .addBooleanOption((opt) =>
          opt.setName('caller-only').setDescription('Only the invoker can confirm').setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('menu')
        .setDescription('Send a message with a dropdown select menu')
        .addStringOption((opt) =>
          opt.setName('definition').setDescription('JS definition object or https:// URL').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('form')
        .setDescription('Open a multi-field modal form')
        .addStringOption((opt) =>
          opt.setName('definition').setDescription('JS definition object or https:// URL').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('poll')
        .setDescription('Create an interactive poll with live results')
        .addStringOption((opt) =>
          opt.setName('definition').setDescription('JS definition object or https:// URL').setRequired(true),
        )
        .addIntegerOption((opt) =>
          opt.setName('expires-in').setDescription('Close poll after this many seconds').setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('embed')
        .setDescription('Send a rich embed, optionally with navigation buttons')
        .addStringOption((opt) =>
          opt.setName('definition').setDescription('JS definition object or https:// URL').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('wizard')
        .setDescription('Send a multi-step wizard with previous / next navigation')
        .addStringOption((opt) =>
          opt.setName('definition').setDescription('JS definition object or https:// URL').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('panel')
        .setDescription('Send a persistent panel that never expires (ticket panel, role selector, etc.)')
        .addStringOption((opt) =>
          opt.setName('definition').setDescription('JS definition object or https:// URL').setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName('name').setDescription('Unique panel name within this server').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('reload')
        .setDescription('Force-reload a cached remote definition URL')
        .addStringOption((opt) =>
          opt.setName('url').setDescription('The remote URL to reload').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Remove an active UI message and disable its components')
        .addStringOption((opt) =>
          opt.setName('message-id').setDescription('ID of the message to delete').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('use')
        .setDescription('Use a saved template with custom arguments')
        .addStringOption((opt) =>
          opt.setName('template').setDescription('Template name').setRequired(true),
        )
        .addStringOption((opt) =>
          opt.setName('args').setDescription('Arguments: key=value key2="value with spaces"').setRequired(false),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('templates')
        .setDescription('List available templates for this server'),
    )
    .addSubcommand((sub) =>
      sub
        .setName('file')
        .setDescription('Load and send a UI definition from a URL')
        .addStringOption((opt) =>
          opt.setName('url').setDescription('URL to a JS file with a module.exports definition').setRequired(true),
        )
        .addIntegerOption((opt) =>
          opt.setName('expires-in').setDescription('Disable components after this many seconds').setRequired(false),
        )
        .addBooleanOption((opt) =>
          opt.setName('ephemeral').setDescription('Only you can see the message').setRequired(false),
        ),
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand(true);
    const handler = SUBCOMMAND_HANDLERS[sub];
    if (handler === undefined) {
      await interaction.reply({ content: 'Unknown subcommand.', ephemeral: true });
      return;
    }
    await handler(interaction);
  },
};
