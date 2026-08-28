CREATE TABLE `active_messages` (
	`message_id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`guild_id` text NOT NULL,
	`caller_id` text NOT NULL,
	`definition_json` text NOT NULL,
	`definition_source` text NOT NULL,
	`state_json` text DEFAULT '{}' NOT NULL,
	`expires_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guilds` (
	`guild_id` text PRIMARY KEY NOT NULL,
	`trusted_domains` text DEFAULT '[]' NOT NULL,
	`command_roles` text DEFAULT '{}' NOT NULL,
	`audit_channel_id` text,
	`default_expiry` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `interaction_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`message_id` text NOT NULL,
	`guild_id` text NOT NULL,
	`user_id` text NOT NULL,
	`component_id` text NOT NULL,
	`component_type` text NOT NULL,
	`outcome` text NOT NULL,
	`occurred_at` integer NOT NULL
);
