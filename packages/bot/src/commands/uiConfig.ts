import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { SlashCommand } from 'shared/slash-command';
import {
  addTrustedDomain,
  removeTrustedDomain,
  setCommandRoles,
  getGuildConfig,
} from '../db/guildConfig.js';
import type { RoleId } from 'shared/ui-types';

export const command: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName('ui-config')
    .setDescription('Configure Nexus for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('trust-domain')
        .setDescription('Allow a domain to be used for remote JS definitions')
        .addStringOption((opt) =>
          opt.setName('domain').setDescription('Domain to trust, e.g. cdn.example.com').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('untrust-domain')
        .setDescription('Remove a domain from the trusted list')
        .addStringOption((opt) =>
          opt.setName('domain').setDescription('Domain to remove').setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('command-roles')
        .setDescription('Set which roles can use a /ui subcommand')
        .addStringOption((opt) =>
          opt
            .setName('command')
            .setDescription('Subcommand name')
            .setRequired(true)
            .addChoices(
              { name: 'dialog', value: 'ui dialog' },
              { name: 'confirm', value: 'ui confirm' },
              { name: 'menu', value: 'ui menu' },
              { name: 'form', value: 'ui form' },
              { name: 'poll', value: 'ui poll' },
              { name: 'embed', value: 'ui embed' },
              { name: 'wizard', value: 'ui wizard' },
              { name: 'panel', value: 'ui panel' },
            ),
        )
        .addStringOption((opt) =>
          opt
            .setName('roles')
            .setDescription('Comma-separated role IDs, or "everyone" to allow all')
            .setRequired(true),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName('status')
        .setDescription('Show the current Nexus configuration for this server'),
    ),

  async execute(interaction) {
    const guildId = interaction.guildId;
    if (guildId === null) {
      await interaction.reply({ content: 'This command cannot be used in DMs.', ephemeral: true });
      return;
    }

    const sub = interaction.options.getSubcommand(true);

    if (sub === 'trust-domain') {
      const domain = interaction.options.getString('domain', true).toLowerCase().trim();
      await addTrustedDomain(guildId, domain);
      await interaction.reply({
        content: `✅ Added \`${domain}\` to the trusted domain list.`,
        ephemeral: true,
      });
      return;
    }

    if (sub === 'untrust-domain') {
      const domain = interaction.options.getString('domain', true).toLowerCase().trim();
      await removeTrustedDomain(guildId, domain);
      await interaction.reply({
        content: `✅ Removed \`${domain}\` from the trusted domain list.`,
        ephemeral: true,
      });
      return;
    }

    if (sub === 'command-roles') {
      const commandName = interaction.options.getString('command', true);
      const rolesRaw = interaction.options.getString('roles', true);
      const roleIds: ReadonlyArray<RoleId> =
        rolesRaw === 'everyone'
          ? []
          : rolesRaw.split(',').map((r) => r.trim() as RoleId);

      await setCommandRoles(guildId, commandName, roleIds);
      const label = roleIds.length === 0 ? 'everyone' : roleIds.map((r) => `<@&${r}>`).join(', ');
      await interaction.reply({
        content: `✅ \`/${commandName}\` is now restricted to: ${label}`,
        ephemeral: true,
      });
      return;
    }

    if (sub === 'status') {
      const config = await getGuildConfig(guildId);
      const domains = config.trustedDomains.join(', ') || 'None (only GitHub raw/Gist allowed)';
      const commandLines = Object.entries(config.commandRoles)
        .map(([cmd, roles]) => {
          const label = roles.length === 0 ? 'everyone' : roles.map((r) => `<@&${r}>`).join(', ');
          return `• \`/${cmd}\` → ${label}`;
        })
        .join('\n') || '• All commands open to everyone';

      await interaction.reply({
        embeds: [{
          title: 'Nexus configuration',
          fields: [
            { name: 'Trusted domains', value: domains, inline: false },
            { name: 'Command restrictions', value: commandLines, inline: false },
            {
              name: 'Default expiry',
              value: config.defaultExpiry !== null ? `${config.defaultExpiry}s` : 'Never',
              inline: true,
            },
            {
              name: 'Audit log channel',
              value: config.auditChannelId !== null ? `<#${config.auditChannelId}>` : 'Disabled',
              inline: true,
            },
          ],
          color: 0x5865f2,
        }],
        ephemeral: true,
      });
      return;
    }
  },
};
