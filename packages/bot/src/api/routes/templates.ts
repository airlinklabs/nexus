import type { FastifyInstance } from 'fastify';
import {
  listTemplates,
  getTemplate,
  getTemplateByName,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../../db/templates.js';
import { evaluateDefinition } from '../../engine/sandbox.js';

export async function templateRoutes(app: FastifyInstance): Promise<void> {
  app.get<{
    Params: { guildId: string };
  }>('/:guildId', async (req, reply) => {
    const { guildId } = req.params;
    const rows = await listTemplates(guildId);
    return reply.send({ templates: rows });
  });

  app.get<{
    Params: { guildId: string; templateId: string };
  }>('/:guildId/:templateId', async (req, reply) => {
    const { guildId, templateId } = req.params;
    const template = await getTemplate(guildId, templateId);
    if (template === null) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Template not found' },
      });
    }
    return reply.send({ template });
  });

  app.post<{
    Params: { guildId: string };
    Body: {
      name: string;
      description?: string;
      definition: string;
      argsSchema?: string;
    };
  }>('/:guildId', async (req, reply) => {
    const { guildId } = req.params;
    const { name, description, definition, argsSchema } = req.body;

    if (typeof name !== 'string' || name.trim().length === 0) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: 'Name is required' },
      });
    }

    if (typeof definition !== 'string' || definition.trim().length === 0) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: 'Definition is required' },
      });
    }

    const existing = await getTemplateByName(guildId, name.trim());
    if (existing !== null) {
      return reply.status(409).send({
        error: { code: 'INVALID_INPUT', message: 'A template with that name already exists' },
      });
    }

    const result = evaluateDefinition(definition);
    if (!result.ok) {
      return reply.status(400).send({
        error: { code: 'INVALID_INPUT', message: result.error },
      });
    }

    const userId = (req as unknown as { userId: string }).userId;

    const template = await createTemplate({
      guildId,
      name: name.trim(),
      description: (description ?? '').trim(),
      definitionSource: definition,
      definitionJson: JSON.stringify(result.definition),
      argsSchema: argsSchema ?? '[]',
      createdBy: userId,
    });

    return reply.status(201).send({ template });
  });

  app.patch<{
    Params: { guildId: string; templateId: string };
    Body: {
      name?: string;
      description?: string;
      definition?: string;
      argsSchema?: string;
    };
  }>('/:guildId/:templateId', async (req, reply) => {
    const { guildId, templateId } = req.params;
    const { name, description, definition, argsSchema } = req.body;

    const existing = await getTemplate(guildId, templateId);
    if (existing === null) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Template not found' },
      });
    }

    if (name !== undefined) {
      const dup = await getTemplateByName(guildId, name.trim());
      if (dup !== null && dup.templateId !== templateId) {
        return reply.status(409).send({
          error: { code: 'INVALID_INPUT', message: 'A template with that name already exists' },
        });
      }
    }

    let definitionJson = existing.definitionJson;
    let definitionSource = existing.definitionSource;

    if (definition !== undefined) {
      const result = evaluateDefinition(definition);
      if (!result.ok) {
        return reply.status(400).send({
          error: { code: 'INVALID_INPUT', message: result.error },
        });
      }
      definitionJson = JSON.stringify(result.definition);
      definitionSource = definition;
    }

    const updated = await updateTemplate(guildId, templateId, {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description.trim() }),
      ...(definition !== undefined && { definitionSource, definitionJson }),
      ...(argsSchema !== undefined && { argsSchema }),
    });

    return reply.send({ template: updated });
  });

  app.delete<{
    Params: { guildId: string; templateId: string };
  }>('/:guildId/:templateId', async (req, reply) => {
    const { guildId, templateId } = req.params;
    const deleted = await deleteTemplate(guildId, templateId);
    if (!deleted) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: 'Template not found' },
      });
    }
    return reply.send({ ok: true });
  });
}
