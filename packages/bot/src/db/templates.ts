import { eq, and } from 'drizzle-orm';
import { db } from './index.js';
import { templates } from './schema.js';
import { randomUUID } from 'node:crypto';

export type TemplateRecord = {
  readonly templateId: string;
  readonly guildId: string;
  readonly name: string;
  readonly description: string;
  readonly definitionSource: string;
  readonly definitionJson: string;
  readonly argsSchema: string;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type TemplateListItem = {
  readonly templateId: string;
  readonly name: string;
  readonly description: string;
  readonly argsSchema: string;
  readonly createdBy: string;
};

export async function listTemplates(guildId: string): Promise<ReadonlyArray<TemplateListItem>> {
  const rows = await db
    .select({
      templateId: templates.templateId,
      name: templates.name,
      description: templates.description,
      argsSchema: templates.argsSchema,
      createdBy: templates.createdBy,
    })
    .from(templates)
    .where(eq(templates.guildId, guildId));

  return rows;
}

export async function getTemplate(
  guildId: string,
  templateId: string,
): Promise<TemplateRecord | null> {
  const rows = await db
    .select()
    .from(templates)
    .where(and(eq(templates.guildId, guildId), eq(templates.templateId, templateId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function getTemplateByName(
  guildId: string,
  name: string,
): Promise<TemplateRecord | null> {
  const rows = await db
    .select()
    .from(templates)
    .where(and(eq(templates.guildId, guildId), eq(templates.name, name)))
    .limit(1);

  return rows[0] ?? null;
}

export async function createTemplate(input: {
  readonly guildId: string;
  readonly name: string;
  readonly description: string;
  readonly definitionSource: string;
  readonly definitionJson: string;
  readonly argsSchema: string;
  readonly createdBy: string;
}): Promise<TemplateRecord> {
  const now = new Date();
  const templateId = randomUUID();

  const row = {
    templateId,
    guildId: input.guildId,
    name: input.name,
    description: input.description,
    definitionSource: input.definitionSource,
    definitionJson: input.definitionJson,
    argsSchema: input.argsSchema,
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(templates).values(row);
  return row;
}

export async function updateTemplate(
  guildId: string,
  templateId: string,
  input: {
    readonly name?: string;
    readonly description?: string;
    readonly definitionSource?: string;
    readonly definitionJson?: string;
    readonly argsSchema?: string;
  },
): Promise<TemplateRecord | null> {
  const existing = await getTemplate(guildId, templateId);
  if (existing === null) return null;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name !== undefined) updates['name'] = input.name;
  if (input.description !== undefined) updates['description'] = input.description;
  if (input.definitionSource !== undefined) updates['definitionSource'] = input.definitionSource;
  if (input.definitionJson !== undefined) updates['definitionJson'] = input.definitionJson;
  if (input.argsSchema !== undefined) updates['argsSchema'] = input.argsSchema;

  await db
    .update(templates)
    .set(updates)
    .where(and(eq(templates.guildId, guildId), eq(templates.templateId, templateId)));

  return { ...existing, ...updates } as TemplateRecord;
}

export async function deleteTemplate(
  guildId: string,
  templateId: string,
): Promise<boolean> {
  const result = await db
    .delete(templates)
    .where(and(eq(templates.guildId, guildId), eq(templates.templateId, templateId)));

  return result.changes > 0;
}
