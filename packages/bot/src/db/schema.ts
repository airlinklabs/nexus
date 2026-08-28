import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const guilds = sqliteTable('guilds', {
  guildId: text('guild_id').primaryKey(),
  trustedDomains: text('trusted_domains').notNull().default('[]'),
  commandRoles: text('command_roles').notNull().default('{}'),
  auditChannelId: text('audit_channel_id'),
  defaultExpiry: integer('default_expiry'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const activeMessages = sqliteTable('active_messages', {
  messageId: text('message_id').primaryKey(),
  channelId: text('channel_id').notNull(),
  guildId: text('guild_id').notNull(),
  callerId: text('caller_id').notNull(),
  definitionJson: text('definition_json').notNull(),
  definitionSource: text('definition_source').notNull(),
  stateJson: text('state_json').notNull().default('{}'),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const interactionLog = sqliteTable('interaction_log', {
  id: integer('id', { mode: 'number' }).primaryKey({ autoIncrement: true }),
  messageId: text('message_id').notNull(),
  guildId: text('guild_id').notNull(),
  userId: text('user_id').notNull(),
  componentId: text('component_id').notNull(),
  componentType: text('component_type', { enum: ['button', 'select', 'modal'] }).notNull(),
  outcome: text('outcome').notNull(),
  occurredAt: integer('occurred_at', { mode: 'timestamp' }).notNull(),
});
