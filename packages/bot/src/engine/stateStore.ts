import type { StoredMessage } from 'shared/ui-types';

type StoreEntry = {
  readonly message: StoredMessage;
  readonly timer: ReturnType<typeof setTimeout> | null;
};

const store = new Map<string, StoreEntry>();

export function storeMessage(message: StoredMessage): void {
  const existing = store.get(message.messageId);
  if (existing?.timer !== null && existing?.timer !== undefined) {
    clearTimeout(existing.timer);
  }

  let timer: ReturnType<typeof setTimeout> | null = null;

  if (message.expiresAt !== null) {
    const ttl = message.expiresAt - Date.now();
    if (ttl > 0) {
      timer = setTimeout(() => {
        store.delete(message.messageId);
      }, ttl);
    } else {
      return;
    }
  }

  store.set(message.messageId, { message, timer });
}

export function getMessage(messageId: string): StoredMessage | null {
  return store.get(messageId)?.message ?? null;
}

export function updateState(
  messageId: string,
  updater: (prev: Record<string, unknown>) => Record<string, unknown>,
): boolean {
  const entry = store.get(messageId);
  if (entry === undefined) return false;

  const updated: StoredMessage = {
    ...entry.message,
    state: updater(entry.message.state),
  };

  store.set(messageId, { ...entry, message: updated });
  return true;
}

export function deleteMessage(messageId: string): void {
  const entry = store.get(messageId);
  if (entry?.timer !== null && entry?.timer !== undefined) {
    clearTimeout(entry.timer);
  }
  store.delete(messageId);
}
