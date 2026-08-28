import type { ChatInputCommandInteraction } from 'discord.js';
import { evaluateDefinition } from '../../engine/sandbox.js';
import { loadRemoteDefinition } from '../../engine/remoteLoader.js';
import { buildMessageOptions } from '../../engine/components.js';
import { storeMessage } from '../../engine/stateStore.js';
import type { UIDefinition, UserId, RoleId, StoredMessage } from 'shared/ui-types';

export type ParsedOptions = {
  readonly definitionRaw: string;
  readonly allowedRoles: ReadonlyArray<RoleId> | null;
  readonly callerOnly: boolean;
  readonly expiresInSeconds: number | null;
  readonly ephemeral: boolean;
};

export function parseCommonOptions(
  interaction: ChatInputCommandInteraction,
): ParsedOptions {
  const definitionRaw = interaction.options.getString('definition', true);
  const rolesRaw = interaction.options.getString('allowed-roles', false);
  const callerOnly = interaction.options.getBoolean('caller-only', false) ?? false;
  const expiresInSeconds = interaction.options.getInteger('expires-in', false);
  const ephemeral = interaction.options.getBoolean('ephemeral', false) ?? false;

  const allowedRoles = rolesRaw !== null
    ? rolesRaw.split(',').map((r) => r.trim() as RoleId)
    : null;

  return { definitionRaw, allowedRoles, callerOnly, expiresInSeconds, ephemeral };
}

export async function resolveDefinition(
  raw: string,
  _guildId: string,
): Promise<UIDefinition | string> {
  const isUrl = raw.startsWith('https://') || raw.startsWith('http://');

  if (isUrl) {
    const defaultTrusted = ['raw.githubusercontent.com', 'gist.githubusercontent.com'];
    const result = await loadRemoteDefinition(raw, defaultTrusted);
    if (!result.ok) return result.error;
    return result.definition;
  }

  const result = evaluateDefinition(raw);
  if (!result.ok) return result.error;
  return result.definition;
}

export async function sendUI(
  interaction: ChatInputCommandInteraction,
  definition: UIDefinition,
  opts: ParsedOptions,
): Promise<void> {
  const messageOptions = buildMessageOptions(definition);
  const ephemeral = opts.ephemeral || (definition.meta.ephemeral ?? false);

  const reply = await interaction.reply({
    ...messageOptions,
    ephemeral,
    fetchReply: true,
  });

  const expiresInSeconds = opts.expiresInSeconds ?? definition.meta.expiresInSeconds ?? null;

  const stored: StoredMessage = {
    messageId: reply.id,
    channelId: interaction.channelId,
    guildId: interaction.guildId ?? 'dm',
    callerId: interaction.user.id as UserId,
    definition,
    state: definition.initialState ?? {},
    expiresAt: expiresInSeconds !== null ? Date.now() + expiresInSeconds * 1000 : null,
  };

  storeMessage(stored);
}
