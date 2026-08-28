import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SlashCommand } from 'shared/slash-command';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function loadCommands(): Promise<Map<string, SlashCommand>> {
  const commands = new Map<string, SlashCommand>();
  const files = readdirSync(__dirname).filter(
    (f) => f.endsWith('.js') && f !== 'index.js',
  );

  for (const file of files) {
    const mod: { command: SlashCommand } = await import(join(__dirname, file));
    commands.set(mod.command.data.name, mod.command);
  }

  return commands;
}
