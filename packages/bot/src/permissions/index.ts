import type { GuildMember, ChatInputCommandInteraction } from 'discord.js';
import type { PermissionTarget, UIDefinition, StoredMessage, UserId, RoleId } from 'shared/ui-types';
import type { GuildConfig } from '../db/guildConfig.js';

export type PermissionResult =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly reason: DenialReason };

export type DenialReason =
  | 'command:no_role'
  | 'component:caller_only'
  | 'component:role'
  | 'message:expired'
  | 'message:not_found';

export function checkCommandPermission(
  commandName: string,
  member: GuildMember,
  guildConfig: GuildConfig,
): PermissionResult {
  if (member.permissions.has('Administrator')) {
    return { allowed: true };
  }

  // Check global role first — applies to all commands
  if (guildConfig.globalRole !== null) {
    const hasGlobal = member.roles.cache.has(guildConfig.globalRole);
    if (!hasGlobal) {
      return { allowed: false, reason: 'command:no_role' };
    }
  }

  const requiredRoles = guildConfig.commandRoles[commandName];

  if (requiredRoles === undefined || requiredRoles.length === 0) {
    return { allowed: true };
  }

  const memberRoles = member.roles.cache;
  const hasRole = requiredRoles.some((roleId) => memberRoles.has(roleId));

  return hasRole
    ? { allowed: true }
    : { allowed: false, reason: 'command:no_role' };
}

export function checkComponentPermission(
  stored: StoredMessage,
  componentId: string,
  member: GuildMember,
): PermissionResult {
  if (stored.expiresAt !== null && Date.now() > stored.expiresAt) {
    return { allowed: false, reason: 'message:expired' };
  }

  const invokerId = member.user.id as UserId;
  const definition = stored.definition;

  if (definition.meta.callerOnly === true && invokerId !== stored.callerId) {
    return { allowed: false, reason: 'component:caller_only' };
  }

  if (definition.meta.allowedBy !== undefined) {
    const result = evaluatePermissionTarget(
      definition.meta.allowedBy,
      member,
      stored.callerId,
    );
    if (!result.allowed) return result;
  }

  const componentDef = findComponentById(definition, componentId);
  if (componentDef !== null && 'allowedBy' in componentDef && componentDef.allowedBy !== undefined) {
    return evaluatePermissionTarget(componentDef.allowedBy, member, stored.callerId);
  }

  if (member.permissions.has('Administrator')) {
    return { allowed: true };
  }

  return { allowed: true };
}

function evaluatePermissionTarget(
  target: PermissionTarget,
  member: GuildMember,
  callerId: UserId,
): PermissionResult {
  switch (target.kind) {
    case 'everyone':
      return { allowed: true };

    case 'caller':
      return (member.user.id as UserId) === callerId
        ? { allowed: true }
        : { allowed: false, reason: 'component:caller_only' };

    case 'roles': {
      if (member.permissions.has('Administrator')) return { allowed: true };
      const memberRoles = member.roles.cache;
      const hasRole = target.ids.some((roleId: RoleId) => memberRoles.has(roleId));
      return hasRole
        ? { allowed: true }
        : { allowed: false, reason: 'component:role' };
    }
  }
}

function findComponentById(
  definition: UIDefinition,
  componentId: string,
) {
  const rows = definition.components ?? [];
  for (const row of rows) {
    for (const comp of row) {
      if (comp.id === componentId) return comp;
    }
  }
  for (const page of definition.pages ?? []) {
    for (const row of page.components ?? []) {
      for (const comp of row) {
        if (comp.id === componentId) return comp;
      }
    }
  }
  return null;
}

export function denialMessage(reason: DenialReason): string {
  switch (reason) {
    case 'command:no_role':
      return "You don't have the role required to use this command.";
    case 'component:caller_only':
      return 'Only the person who created this menu can interact with it.';
    case 'component:role':
      return "You don't have the role required to interact with this component.";
    case 'message:expired':
      return 'This component has expired and is no longer accepting interactions.';
    case 'message:not_found':
      return 'This component is no longer active.';
  }
}
