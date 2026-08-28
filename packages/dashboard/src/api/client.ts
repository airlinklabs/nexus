import { z } from 'zod';

const API_BASE =
  import.meta.env['VITE_API_BASE_URL'] ?? '';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

async function request<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  const json: unknown = await res.json();

  if (!res.ok) {
    const errorParsed = ApiErrorSchema.safeParse(json);
    if (errorParsed.success) {
      throw new ApiError(
        errorParsed.data.error.code,
        errorParsed.data.error.message,
        res.status,
      );
    }
    throw new ApiError('INTERNAL', 'An unexpected error occurred.', res.status);
  }

  return schema.parse(json);
}

const MeSchema = z.object({
  userId: z.string(),
  username: z.string(),
  avatar: z.string().nullable(),
});

const GuildSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullable(),
});

const GuildListSchema = z.object({
  guilds: z.array(GuildSchema),
});

const GuildConfigSchema = z.object({
  config: z.object({
    guildId: z.string(),
    trustedDomains: z.array(z.string()),
    commandRoles: z.record(z.array(z.string())),
    globalRole: z.string().nullable(),
    auditChannelId: z.string().nullable(),
    defaultExpiry: z.number().nullable(),
  }),
  guild: z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string().nullable(),
  }),
});

const LogEntrySchema = z.object({
  id: z.number(),
  messageId: z.string(),
  userId: z.string(),
  componentId: z.string(),
  componentType: z.enum(['button', 'select', 'modal']),
  outcome: z.string(),
  occurredAt: z.string(),
});

const LogSchema = z.object({ log: z.array(LogEntrySchema) });

const TemplateListItemSchema = z.object({
  templateId: z.string(),
  name: z.string(),
  description: z.string(),
  argsSchema: z.string(),
  createdBy: z.string(),
});

const TemplateListSchema = z.object({ templates: z.array(TemplateListItemSchema) });

const TemplateDetailSchema = z.object({
  templateId: z.string(),
  guildId: z.string(),
  name: z.string(),
  description: z.string(),
  definitionSource: z.string(),
  definitionJson: z.string(),
  argsSchema: z.string(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const api = {
  auth: {
    me: () => request('/auth/me', MeSchema),
    logout: () =>
      request('/auth/logout', z.object({ ok: z.boolean() }), {
        method: 'POST',
      }),
    loginUrl: () => `${API_BASE}/auth/login`,
  },

  guilds: {
    list: () => request('/api/guilds', GuildListSchema),
    get: (guildId: string) =>
      request(`/api/guilds/${guildId}`, GuildConfigSchema),
    addDomain: (guildId: string, domain: string) =>
      request(
        `/api/guilds/${guildId}/trusted-domains`,
        z.object({ ok: z.boolean() }),
        {
          method: 'PATCH',
          body: JSON.stringify({ action: 'add', domain }),
        },
      ),
    removeDomain: (guildId: string, domain: string) =>
      request(
        `/api/guilds/${guildId}/trusted-domains`,
        z.object({ ok: z.boolean() }),
        {
          method: 'PATCH',
          body: JSON.stringify({ action: 'remove', domain }),
        },
      ),
    setCommandRoles: (
      guildId: string,
      commandName: string,
      roleIds: string[],
    ) =>
      request(
        `/api/guilds/${guildId}/command-roles`,
        z.object({ ok: z.boolean() }),
        {
          method: 'PATCH',
          body: JSON.stringify({ commandName, roleIds }),
        },
      ),
    setGlobalRole: (guildId: string, roleId: string | null) =>
      request(
        `/api/guilds/${guildId}/global-role`,
        z.object({ ok: z.boolean() }),
        {
          method: 'PATCH',
          body: JSON.stringify({ roleId }),
        },
      ),
    roles: (guildId: string) =>
      request(
        `/api/guilds/${guildId}/roles`,
        z.object({
          roles: z.array(z.object({
            id: z.string(),
            name: z.string(),
            color: z.number(),
            position: z.number(),
          })),
        }),
      ),
  },

  messages: {
    log: (guildId: string, limit = 50) =>
      request(`/api/messages/${guildId}/log?limit=${limit}`, LogSchema),
  },

  templates: {
    list: (guildId: string) =>
      request(`/api/templates/${guildId}`, TemplateListSchema),
    get: (guildId: string, templateId: string) =>
      request(`/api/templates/${guildId}/${templateId}`, z.object({ template: TemplateDetailSchema })),
    create: (
      guildId: string,
      data: { name: string; description: string; definition: string; argsSchema?: string },
    ) =>
      request(
        `/api/templates/${guildId}`,
        z.object({ template: TemplateDetailSchema }),
        {
          method: 'POST',
          body: JSON.stringify(data),
        },
      ),
    update: (
      guildId: string,
      templateId: string,
      data: { name?: string; description?: string; definition?: string; argsSchema?: string },
    ) =>
      request(
        `/api/templates/${guildId}/${templateId}`,
        z.object({ template: TemplateDetailSchema }),
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        },
      ),
    delete: (guildId: string, templateId: string) =>
      request(
        `/api/templates/${guildId}/${templateId}`,
        z.object({ ok: z.boolean() }),
        { method: 'DELETE' },
      ),
  },
} as const;

export type Guild = z.infer<typeof GuildSchema>;
export type GuildConfig = z.infer<typeof GuildConfigSchema>['config'];
export type LogEntry = z.infer<typeof LogEntrySchema>;
export type TemplateListItem = z.infer<typeof TemplateListItemSchema>;
export type TemplateDetail = z.infer<typeof TemplateDetailSchema>;
