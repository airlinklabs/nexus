import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SlashCommand } from 'shared/slash-command';

const __dirname = dirname(fileURLToPath(import.meta.url));

function isCommandFile(filename: string): boolean {
  return filename.endsWith('.js') &&
    !filename.endsWith('.d.ts') &&
    filename !== 'index.js';
}

function isCommandDirectory(entry: string): boolean {
  try {
    const dirPath = join(__dirname, entry);
    const stat = statSync(dirPath);
    if (!stat.isDirectory()) return false;
    const dirFiles = readdirSync(dirPath);
    return dirFiles.includes('index.js');
  } catch {
    return false;
  }
}

export async function loadCommands(): Promise<Map<string, SlashCommand>> {
  const commands = new Map<string, SlashCommand>();
  const entries = readdirSync(__dirname);

  for (const entry of entries) {
    if (isCommandFile(entry)) {
      const mod: { command: SlashCommand } = await import(join(__dirname, entry));
      commands.set(mod.command.data.name, mod.command);
    } else if (isCommandDirectory(entry)) {
      const mod: { command: SlashCommand } = await import(join(__dirname, entry, 'index.js'));
      commands.set(mod.command.data.name, mod.command);
    }
  }

  return commands;
}
