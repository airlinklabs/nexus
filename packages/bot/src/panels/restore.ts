import { db } from '../db/index.js';
import { panels } from '../db/schema.js';
import { storeMessage } from '../db/messageStore.js';
import { evaluateDefinition } from '../engine/sandbox.js';
import { loadRemoteDefinition } from '../engine/remoteLoader.js';
import { panelLogger } from '../logger.js';
import type { StoredMessage, UserId } from 'shared/ui-types';
import type { Client } from 'discord.js';

export async function restorePanels(client: Client): Promise<void> {
  const allPanels = await db.query.panels.findMany();
  let restored = 0;
  let failed = 0;

  for (const panel of allPanels) {
    if (panel.messageId === null) continue;

    const isUrl = panel.definitionSource.startsWith('https://');
    const result = isUrl
      ? await loadRemoteDefinition(panel.definitionSource, [
          'raw.githubusercontent.com',
          'gist.githubusercontent.com',
        ])
      : evaluateDefinition(panel.definitionSource);

    if (!result.ok) {
      panelLogger.warn(
        { panelId: panel.panelId, guildId: panel.guildId, error: result.error },
        'Could not restore panel',
      );
      failed++;
      continue;
    }

    const stored: StoredMessage = {
      messageId: panel.messageId,
      channelId: panel.channelId,
      guildId: panel.guildId,
      callerId: panel.createdBy as UserId,
      definition: result.definition,
      state: {},
      expiresAt: null,
    };

    await storeMessage(stored, panel.definitionSource);
    restored++;
  }

  panelLogger.info({ restored, failed }, 'Panel restore complete');
}
