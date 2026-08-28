import { db } from './index.js';
import { interactionLog } from './schema.js';

type LogEntry = {
  readonly messageId: string;
  readonly guildId: string;
  readonly userId: string;
  readonly componentId: string;
  readonly componentType: 'button' | 'select' | 'modal';
  readonly outcome: string;
};

export async function logInteraction(entry: LogEntry): Promise<void> {
  await db.insert(interactionLog).values({
    ...entry,
    occurredAt: new Date(),
  });
}
