import { describe, it, expect } from 'vitest';
import { checkCommandPermission, checkComponentPermission, denialMessage } from '../index.js';
import type { GuildMember } from 'discord.js';
import type { UIDefinition, StoredMessage, UserId, RoleId } from 'shared/ui-types';

function makeMember(opts: {
  isAdmin?: boolean;
  roleIds?: string[];
  userId?: string;
}): GuildMember {
  const { isAdmin = false, roleIds = [], userId = 'user-1' } = opts;

  return {
    user: { id: userId },
    permissions: {
      has: (perm: string) => isAdmin && perm === 'Administrator',
    },
    roles: {
      cache: new Map(roleIds.map((id) => [id, { id }])),
    },
  } as unknown as GuildMember;
}

function makeStoredMessage(overrides: Partial<StoredMessage> = {}): StoredMessage {
  const definition: UIDefinition = {
    meta: {},
    components: [[{ type: 'button', id: 'btn-1', label: 'Click me', style: 'primary' }]],
    handlers: { buttons: { 'btn-1': async () => {} } },
    ...overrides.definition,
  };

  return {
    messageId: 'msg-1',
    channelId: 'ch-1',
    guildId: 'guild-1',
    callerId: 'user-1' as UserId,
    definition,
    state: {},
    expiresAt: null,
    ...overrides,
  };
}

describe('checkCommandPermission', () => {
  it('allows everyone when no roles are configured', () => {
    const member = makeMember({});
    const result = checkCommandPermission('ui dialog', member, {
      guildId: 'guild-1',
      trustedDomains: [],
      commandRoles: {},
      globalRole: null,
      auditChannelId: null,
      defaultExpiry: null,
    });
    expect(result.allowed).toBe(true);
  });

  it('allows admin regardless of configured roles', () => {
    const member = makeMember({ isAdmin: true });
    const result = checkCommandPermission('ui dialog', member, {
      guildId: 'guild-1',
      trustedDomains: [],
      commandRoles: { 'ui dialog': ['role-mod' as RoleId] },
      globalRole: null,
      auditChannelId: null,
      defaultExpiry: null,
    });
    expect(result.allowed).toBe(true);
  });

  it('denies member without required role', () => {
    const member = makeMember({ roleIds: ['role-member'] });
    const result = checkCommandPermission('ui dialog', member, {
      guildId: 'guild-1',
      trustedDomains: [],
      commandRoles: { 'ui dialog': ['role-mod' as RoleId] },
      globalRole: null,
      auditChannelId: null,
      defaultExpiry: null,
    });
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('command:no_role');
  });

  it('allows member with required role', () => {
    const member = makeMember({ roleIds: ['role-mod'] });
    const result = checkCommandPermission('ui dialog', member, {
      guildId: 'guild-1',
      trustedDomains: [],
      commandRoles: { 'ui dialog': ['role-mod' as RoleId] },
      globalRole: null,
      auditChannelId: null,
      defaultExpiry: null,
    });
    expect(result.allowed).toBe(true);
  });
});

describe('checkComponentPermission', () => {
  it('denies interaction on expired message', () => {
    const stored = makeStoredMessage({ expiresAt: Date.now() - 1000 });
    const member = makeMember({});
    const result = checkComponentPermission(stored, 'btn-1', member);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('message:expired');
  });

  it('denies non-caller on caller-only message', () => {
    const stored = makeStoredMessage({
      callerId: 'user-1' as UserId,
      definition: { meta: { callerOnly: true }, components: [] },
    });
    const member = makeMember({ userId: 'user-2' });
    const result = checkComponentPermission(stored, 'btn-1', member);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('component:caller_only');
  });

  it('allows caller on caller-only message', () => {
    const stored = makeStoredMessage({
      callerId: 'user-1' as UserId,
      definition: { meta: { callerOnly: true }, components: [] },
    });
    const member = makeMember({ userId: 'user-1' });
    const result = checkComponentPermission(stored, 'btn-1', member);
    expect(result.allowed).toBe(true);
  });

  it('denies member without per-component role', () => {
    const stored = makeStoredMessage({
      definition: {
        meta: {},
        components: [[{
          type: 'button',
          id: 'btn-1',
          label: 'Admin only',
          style: 'danger',
          allowedBy: { kind: 'roles', ids: ['role-admin' as RoleId] },
        }]],
      },
    });
    const member = makeMember({ roleIds: ['role-member'] });
    const result = checkComponentPermission(stored, 'btn-1', member);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toBe('component:role');
  });

  it('allows admin to bypass per-component role restriction', () => {
    const stored = makeStoredMessage({
      definition: {
        meta: {},
        components: [[{
          type: 'button',
          id: 'btn-1',
          label: 'Admin only',
          style: 'danger',
          allowedBy: { kind: 'roles', ids: ['role-mod' as RoleId] },
        }]],
      },
    });
    const member = makeMember({ isAdmin: true });
    const result = checkComponentPermission(stored, 'btn-1', member);
    expect(result.allowed).toBe(true);
  });
});

describe('denialMessage', () => {
  it('returns a non-empty string for every DenialReason', () => {
    const reasons = [
      'command:no_role',
      'component:caller_only',
      'component:role',
      'message:expired',
      'message:not_found',
    ] as const;

    for (const reason of reasons) {
      const msg = denialMessage(reason);
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    }
  });
});
