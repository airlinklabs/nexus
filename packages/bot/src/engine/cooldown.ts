type CooldownKey = `${string}:${string}:${string}`;

const cooldowns = new Map<CooldownKey, number>();

export type CooldownResult =
  | { readonly onCooldown: false }
  | { readonly onCooldown: true; readonly remainingSeconds: number };

export function checkCooldown(
  userId: string,
  messageId: string,
  componentId: string,
): CooldownResult {
  const key: CooldownKey = `${userId}:${messageId}:${componentId}`;
  const unlockAt = cooldowns.get(key);
  if (unlockAt === undefined || Date.now() >= unlockAt) {
    return { onCooldown: false };
  }
  return {
    onCooldown: true,
    remainingSeconds: Math.ceil((unlockAt - Date.now()) / 1000),
  };
}

export function setCooldown(
  userId: string,
  messageId: string,
  componentId: string,
  seconds: number,
): void {
  const key: CooldownKey = `${userId}:${messageId}:${componentId}`;
  cooldowns.set(key, Date.now() + seconds * 1000);
}
