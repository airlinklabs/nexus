import { eq, lt } from 'drizzle-orm';
import { db } from './index.js';
import { activeMessages } from './schema.js';
import { evaluateDefinition } from '../engine/sandbox.js';
import { loadRemoteDefinition } from '../engine/remoteLoader.js';
import type { StoredMessage, UIDefinition, UserId } from 'shared/ui-types';

async function hydrateDefinition(
  source: string,
  definitionJson: string,
): Promise<UIDefinition | null> {
  const isUrl = source.startsWith('https://') || source.startsWith('http://');

  let result;
  if (isUrl) {
    result = await loadRemoteDefinition(source, ['raw.githubusercontent.com', 'gist.githubusercontent.com']);
  } else {
    result = evaluateDefinition(source);
  }

  if (!result.ok) return null;

  const stored = JSON.parse(definitionJson) as Partial<UIDefinition>;
  return {
    ...stored,
    ...result.definition,
    meta: result.definition.meta,
  } as UIDefinition;
}

export async function storeMessage(
  message: StoredMessage,
  source: string,
): Promise<void> {
  const { handlers: _handlers, ...serializable } = message.definition;
  const now = new Date();

  await db.insert(activeMessages).values({
    messageId: message.messageId,
    channelId: message.channelId,
    guildId: message.guildId,
    callerId: message.callerId,
    definitionJson: JSON.stringify(serializable),
    definitionSource: source,
    stateJson: JSON.stringify(message.state),
    expiresAt: message.expiresAt !== null ? new Date(message.expiresAt) : null,
    createdAt: now,
  }).onConflictDoNothing();
}

export async function getMessage(messageId: string): Promise<StoredMessage | null> {
  const row = await db.query.activeMessages.findFirst({
    where: eq(activeMessages.messageId, messageId),
  });

  if (row === undefined) return null;

  const definition = await hydrateDefinition(row.definitionSource, row.definitionJson);
  if (definition === null) return null;

  return {
    messageId: row.messageId,
    channelId: row.channelId,
    guildId: row.guildId,
    callerId: row.callerId as UserId,
    definition,
    state: JSON.parse(row.stateJson) as Record<string, unknown>,
    expiresAt: row.expiresAt !== null ? row.expiresAt.getTime() : null,
  };
}

export async function updateState(
  messageId: string,
  updater: (prev: Record<string, unknown>) => Record<string, unknown>,
): Promise<boolean> {
  const row = await db.query.activeMessages.findFirst({
    where: eq(activeMessages.messageId, messageId),
  });

  if (row === undefined) return false;

  const prev = JSON.parse(row.stateJson) as Record<string, unknown>;
  const next = updater(prev);

  await db
    .update(activeMessages)
    .set({ stateJson: JSON.stringify(next) })
    .where(eq(activeMessages.messageId, messageId));

  return true;
}

export async function deleteMessage(messageId: string): Promise<void> {
  await db.delete(activeMessages).where(eq(activeMessages.messageId, messageId));
}

export async function purgeExpired(): Promise<void> {
  await db.delete(activeMessages).where(lt(activeMessages.expiresAt, new Date()));
}
