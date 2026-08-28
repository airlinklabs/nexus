import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SlashCommand } from 'shared/slash-command';

const __dirname = dirname(fileURLToPath(import.meta.url));

function isCommandFile(filename: string): boolean {
  return (filename.endsWith('.js') || filename.endsWith('.ts')) &&
    !filename.endsWith('.d.ts') &&
    filename !== 'index.js' && filename !== 'index.ts';
}

function isCommandDirectory(entry: string): boolean {
  try {
    const dirPath = join(__dirname, entry);
    const stat = statSync(dirPath);
    if (!stat.isDirectory()) return false;
    const dirFiles = readdirSync(dirPath);
    return dirFiles.includes('index.js') || dirFiles.includes('index.ts');
  } catch {
    return false;
  }
}

function commandPath(dir: string, file: string): string {
  // Prefer .js (compiled) over .ts (source)
  const jsVersion = file.replace(/\.ts$/, '.js');
  if (file.endsWith('.js')) return join(dir, file);
  return join(dir, file);
}

function commandIndexPath(dir: string): string {
  const dirFiles = readdirSync(dir);
  if (dirFiles.includes('index.js')) return join(dir, 'index.js');
  return join(dir, 'index.ts');
}

export async function loadCommands(): Promise<Map<string, SlashCommand>> {
  const commands = new Map<string, SlashCommand>();
  const entries = readdirSync(__dirname);

  for (const entry of entries) {
    if (isCommandFile(entry)) {
      const mod: { command: SlashCommand } = await import(commandPath(__dirname, entry));
      commands.set(mod.command.data.name, mod.command);
    } else if (isCommandDirectory(entry)) {
      const mod: { command: SlashCommand } = await import(commandIndexPath(join(__dirname, entry)));
      commands.set(mod.command.data.name, mod.command);
    }
  }

  return commands;
}
